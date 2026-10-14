import { useEffect, useState, type ReactElement } from "react";
import {
  esquemaHorarioCompleto, esquemaLocal, esquemaTemporada,
  type DatosExcepcion, type DatosTemporada, type HorarioCompleto, type HorarioSemanal, type Local,
} from "@peluqueria/compartido";
import { esAbortada, mensajeDeError, pedir, pedirJson } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import DatosSalon from "./DatosSalon";
import HorarioGeneral from "./HorarioGeneral";
import Temporadas from "./Temporadas";
import Excepciones from "./Excepciones";
import styles from "./Horario.module.css";

type DatosHorario = { local: Local; horario: HorarioCompleto };

async function cargarDatos(signal?: AbortSignal): Promise<DatosHorario> {
  const [local, horario] = await Promise.all([
    pedirJson("/api/local", esquemaLocal, { signal }),
    pedirJson("/api/horario", esquemaHorarioCompleto, { signal }),
  ]);
  signal?.throwIfAborted();
  return { local, horario };
}

function opcionesJson(method: string, datos: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) };
}

export default function Horario(): ReactElement {
  const { puede } = useSesion();
  const [datos, setDatos] = useState<DatosHorario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [revision, setRevision] = useState(0);
  const [intento, setIntento] = useState(0);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const controlador = new AbortController();
    const cargar = async (): Promise<void> => {
      setCargando(true);
      try {
        const recibidos = await cargarDatos(controlador.signal);
        setDatos(recibidos);
        setError(null);
        setRevision((anterior) => anterior + 1);
      } catch (fallo) {
        if (controlador.signal.aborted || esAbortada(fallo)) return;
        setError(`No se pudo cargar el horario: ${mensajeDeError(fallo)}`);
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    };
    void cargar();
    return () => controlador.abort();
  }, [intento]);

  const ejecutarEscritura = async <T,>(accion: () => Promise<T>): Promise<T> => {
    if (!puede("local:gestionar")) throw new Error("No tienes permiso para gestionar el local");
    setGuardado(false);
    setCargando(true);
    try {
      const resultado = await accion();
      try {
        const recibidos = await cargarDatos();
        setDatos(recibidos);
        setRevision((anterior) => anterior + 1);
        setError(null);
        setGuardado(true);
      } catch (fallo) {
        // Ocultar los formularios evita repetir una creación que el servidor ya aceptó.
        setDatos(null);
        setError(`Los cambios se guardaron, pero no se pudo refrescar el horario. Recarga antes de continuar: ${mensajeDeError(fallo)}`);
      }
      return resultado;
    } finally {
      setCargando(false);
    }
  };

  const guardarLocal = async (local: Local): Promise<void> => {
    await ejecutarEscritura(() => pedir("/api/local", opcionesJson("PUT", local)));
  };
  const guardarGeneral = async (semana: HorarioSemanal): Promise<void> => {
    await ejecutarEscritura(() => pedir("/api/horario/general", opcionesJson("PUT", semana)));
  };
  const guardarTemporada = async (id: number | null, temporada: DatosTemporada): Promise<number> => {
    return ejecutarEscritura(async () => {
      if (id !== null) {
        await pedir(`/api/temporadas/${id}`, opcionesJson("PATCH", temporada));
        return id;
      }
      const creada = await pedirJson("/api/temporadas", esquemaTemporada.pick({ id: true }), opcionesJson("POST", temporada));
      return creada.id;
    });
  };
  const guardarSemanaTemporada = async (id: number, semana: HorarioSemanal): Promise<void> => {
    await ejecutarEscritura(() => pedir(`/api/temporadas/${id}/horario`, opcionesJson("PUT", semana)));
  };
  const guardarExcepcion = async (id: number | null, excepcion: DatosExcepcion): Promise<void> => {
    const url = id === null ? "/api/excepciones" : `/api/excepciones/${id}`;
    await ejecutarEscritura(() => pedir(url, opcionesJson(id === null ? "POST" : "PATCH", excepcion)));
  };
  const eliminarExcepcion = async (id: number): Promise<void> => {
    await ejecutarEscritura(() => pedir(`/api/excepciones/${id}`, { method: "DELETE" }));
  };

  return <div className={styles.horario}>
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {error && <button type="button" disabled={cargando} onClick={() => setIntento((anterior) => anterior + 1)}>Recargar horario</button>}
    {cargando && <p role="status">Cargando horario…</p>}
    {guardado && <p role="status" className={styles.confirmacion}>Cambios guardados.</p>}
    {datos && <fieldset className={styles.contenido} disabled={cargando}>
      <div className={styles.columna}>
        <DatosSalon key={`local-${revision}`} local={datos.local} onGuardar={guardarLocal} />
        <HorarioGeneral key={`general-${revision}`} general={datos.horario.general} onGuardar={guardarGeneral} />
      </div>
      <div className={styles.columna}>
        <Temporadas temporadas={datos.horario.temporadas} revision={revision}
          onGuardarDatos={guardarTemporada} onGuardarHorario={guardarSemanaTemporada} />
        <Excepciones excepciones={datos.horario.excepciones} revision={revision}
          onGuardar={guardarExcepcion} onEliminar={eliminarExcepcion} />
      </div>
    </fieldset>}
  </div>;
}
