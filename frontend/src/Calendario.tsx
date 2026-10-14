import { useCallback, useEffect, useState, type ReactElement } from "react";
import { z } from "zod";
import { esquemaCita, esquemaCliente, esquemaServicio, type DatosCliente, esquemaLocal, esquemaDiaResuelto, type Local, type DiaResuelto } from "@peluqueria/compartido";
import type { Cita, Cliente, Servicio, Seleccion } from "./tipos";
import { esAbortada, mensajeDeError, pedir, pedirJson } from "./peticion";
import CabeceraDias from "./calendario/CabeceraDias";
import Rejilla from "./calendario/Rejilla";
import TarjetaCita from "./calendario/TarjetaCita";
import { lunesDeEstaSemana, sumarDias } from "./calendario/fechas";
import { fechaDeDia, rangoDeHorario } from "./calendario/horario";
import { diasVisibles } from "./calendario/diasVisibles";
import { columnaDeFecha, filasDeCita } from "./calendario/posicion";
import styles from "./Calendario.module.css";
import Panel from "./calendario/Panel";
import { useSesion } from "./sesion/useSesion";


function Calendario(): ReactElement {
  const { puede } = useSesion();
  const [citas, setCitas] = useState<Cita[]>([]);
  const [local, setLocal] = useState<Local | null>(null);
  const [semanaHorario, setSemanaHorario] = useState<{ desde: string; dias: DiaResuelto[] } | null>(null);
  const [errorHorario, setErrorHorario] = useState<string | null>(null);
  const zonaDispositivo = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const consultarSemana = useCallback((desde: string, signal: AbortSignal): Promise<DiaResuelto[]> =>
    pedirJson(`/api/horario/semana?desde=${desde}`, z.array(esquemaDiaResuelto).length(7), { signal }), []);
  const [mostrarCerrados, setMostrarCerrados] = useState(false);
  const [lunesVisible, setLunesVisible] = useState(() =>
    lunesDeEstaSemana(new Date())
  );
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refrescarCitas = async (): Promise<void> => {
    try {
      setCitas(await pedirJson("/api/citas", z.array(esquemaCita)));
    } catch (fallo) {
      const aviso = `No se pudieron cargar las citas: ${mensajeDeError(fallo)}`;
      // Si también falló la acción, conservar su motivo ayuda a corregirla.
      setError((anterior) => anterior ? `${anterior} ${aviso}` : aviso);
    }
  };

  // Mismo ciclo para crear, mover, cancelar y completar. Si falla, el panel
  // sigue abierto con el motivo, y se refresca igualmente: tras un 409 lo
  // que se ve está desactualizado.
  const ejecutarAccion = async (
    accion: () => Promise<Response>,
    porDefecto: string
  ): Promise<void> => {
    try {
      await accion();
    } catch (fallo) {
      setError(mensajeDeError(fallo, porDefecto));
      await refrescarCitas();
      return;
    }

    setError(null);
    await refrescarCitas();
    setSeleccion(null);
  };

  const seleccionarHueco = (dia: Date, hora: number, minuto: number): void => {
    if (!puede("citas:gestionar")) return;
    const inicio = new Date(dia);
    inicio.setHours(hora, minuto, 0, 0);
    setError(null);
    setSeleccion({ tipo: "hueco", inicio });
  };

  const seleccionarCita = (id: number): void => {
    setError(null);
    setSeleccion({ tipo: "cita", id });
  };

  const crearCita = (clienteId: number, servicioId: number, inicio: Date) =>
    ejecutarAccion(
      () => pedir("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          servicio_id: servicioId,
          inicio: inicio.toISOString(),
        }),
      }),
      "No se pudo crear la cita"
    );

  const cancelarCita = (id: number) =>
    ejecutarAccion(
      () => pedir(`/api/citas/${id}/cancelar`, { method: "POST" }),
      "No se pudo cancelar la cita"
    );

  const completarCita = (id: number) =>
    ejecutarAccion(
      () => pedir(`/api/citas/${id}/completar`, { method: "POST" }),
      "No se pudo completar la cita"
    );

  const crearCliente = async (datos: DatosCliente): Promise<number | null> => {
    setError(null);
    let idCreado: number;
    try {
      const creado = await pedirJson("/api/clientes", esquemaCliente.pick({ id: true }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      idCreado = creado.id;
    } catch (fallo) {
      setError(`No se pudo crear el cliente: ${mensajeDeError(fallo)}`);
      return null;
    }

    // Refrescar desde el servidor para que el nuevo aparezca en el desplegable.
    try {
      setClientes(await pedirJson("/api/clientes", z.array(esquemaCliente)));
    } catch (fallo) {
      // Avisar de que ya existe: si no, se intentaría crear dos veces.
      setError(`El cliente se creó, pero no se pudo actualizar la lista. No vuelvas a crearlo: ${mensajeDeError(fallo)}`);
      return null;
    }
    return idCreado;
  };

  useEffect(() => {
    const controlador = new AbortController();
    pedirJson("/api/citas", z.array(esquemaCita), { signal: controlador.signal })
      .then((lista) => {
        if (!controlador.signal.aborted) setCitas(lista);
      })
      .catch((fallo) => {
        if (controlador.signal.aborted || esAbortada(fallo)) return;
        setError(`No se pudieron cargar las citas: ${mensajeDeError(fallo)}`);
      });
    return () => { controlador.abort(); };
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    pedirJson("/api/clientes", z.array(esquemaCliente), { signal: controlador.signal })
      .then((lista) => {
        if (!controlador.signal.aborted) setClientes(lista);
      })
      .catch((fallo) => {
        if (controlador.signal.aborted || esAbortada(fallo)) return;
        setError(`No se pudieron cargar los clientes: ${mensajeDeError(fallo)}`);
      });
    return () => { controlador.abort(); };
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    pedirJson("/api/servicios?incluirInactivos=true", z.array(esquemaServicio), { signal: controlador.signal })
      .then((lista) => {
        if (!controlador.signal.aborted) setServicios(lista);
      })
      .catch((fallo) => {
        if (controlador.signal.aborted || esAbortada(fallo)) return;
        setError(`No se pudieron cargar los servicios: ${mensajeDeError(fallo)}`);
      });
    return () => { controlador.abort(); };
  }, []);


  const semanaAnterior = () => setLunesVisible(sumarDias(lunesVisible, -7));
  const semanaSiguiente = () => setLunesVisible(sumarDias(lunesVisible, 7));

  const citaSeleccionada =
    seleccion?.tipo === "cita"
      ? citas.find((c) => c.id === seleccion.id) ?? null
      : null;

  const moverCita = (id: number, inicio: string) =>
    ejecutarAccion(
      () => pedir(`/api/citas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inicio }),
      }),
      "No se pudo mover la cita"
    );

  useEffect(() => {
    const controlador = new AbortController();
    pedirJson("/api/local", esquemaLocal, { signal: controlador.signal })
      .then((datos) => { if (!controlador.signal.aborted) setLocal(datos); })
      .catch((fallo) => {
        if (controlador.signal.aborted || esAbortada(fallo)) return;
        setError(`No se pudieron cargar los datos del salón: ${mensajeDeError(fallo)}`);
      });
    return () => controlador.abort();
  }, []);

  useEffect(() => {
    const controlador = new AbortController();
    const desde = fechaDeDia(lunesVisible);
    consultarSemana(desde, controlador.signal)
      .then((dias) => {
        if (controlador.signal.aborted) return;
        setSemanaHorario({ desde, dias });
        setErrorHorario(null);
      })
      .catch((fallo) => {
        if (controlador.signal.aborted || esAbortada(fallo)) return;
        setErrorHorario(`No se pudo cargar el horario: ${mensajeDeError(fallo)}`);
      });
    return () => controlador.abort();
  }, [lunesVisible, consultarSemana]);

  const horario = semanaHorario?.desde === fechaDeDia(lunesVisible) ? semanaHorario.dias : [];
  const rango = rangoDeHorario(horario);
  const domingoSiguiente = sumarDias(lunesVisible, 7);

  const citasDeLaSemana = citas.filter((cita) => {
    const inicio = new Date(cita.inicio);
    return inicio >= lunesVisible && inicio < domingoSiguiente;
  });
  const dias = diasVisibles(lunesVisible, citasDeLaSemana, mostrarCerrados, horario);
  const citasFueraRango = citasDeLaSemana.filter((cita) =>
    filasDeCita(new Date(cita.inicio), new Date(cita.fin), rango.horaInicio, rango.franjas) === null);
  const columnas = dias.length === 0 ? "60px" : `60px repeat(${dias.length}, minmax(0, 1fr))`;

  return (
    <section className={styles.pagina}>
      <h1 className={styles.titulo}>Agenda</h1>
      {local && zonaDispositivo !== local.zona_horaria && <p className={styles.aviso} role="status">
        Este dispositivo está en otra zona horaria ({zonaDispositivo}). Las horas se muestran en la hora del dispositivo, no en la del salón ({local.zona_horaria}).
      </p>}
      {errorHorario && <p role="alert" className={styles.error}>{errorHorario}</p>}
      {horario.length === 0 && !errorHorario && <p role="status">Cargando horario…</p>}
      {horario.length > 0 && dias.length === 0 && <p className={styles.aviso}>Esta semana el local está cerrado. Activa «Mostrar días cerrados» para ver sus días.</p>}
      <div className={styles.distribucion}>
        <div className={styles.agenda}>
          <div className={styles.opciones}>
            {seleccion === null && error !== null && (
              <p role="alert" className={styles.error}>{error}</p>
            )}
            <label className={styles.mostrarCerrados}>
              <input
                type="checkbox"
                checked={mostrarCerrados}
                onChange={(evento) => setMostrarCerrados(evento.target.checked)}
              />
              Mostrar días cerrados
            </label>
          </div>

          <div
            className={styles.calendario}
            style={{ gridTemplateRows: `48px repeat(${rango.franjas}, minmax(4px, 1fr))`, gridTemplateColumns: columnas }}
          >
            <CabeceraDias dias={dias} lunes={lunesVisible} horario={horario} onAnterior={semanaAnterior} onSiguiente={semanaSiguiente} />
            <Rejilla
              dias={dias}
              horario={horario}
              rango={rango}
              huecoSeleccionado={seleccion?.tipo === "hueco" ? seleccion.inicio : null}
              onSeleccionarHueco={seleccionarHueco}
            />
            {citasDeLaSemana.map((cita) => {
              const columna = columnaDeFecha(new Date(cita.inicio), dias);
              if (columna === null) {
                return null;
              }

              return (
                <TarjetaCita
                  key={cita.id}
                  cita={cita}
                  columna={columna}
                  horaInicio={rango.horaInicio}
                  franjas={rango.franjas}
                  seleccionada={seleccion?.tipo === "cita" && seleccion.id === cita.id}
                  onSeleccionarCita={seleccionarCita}
                />
              );
            })}
          </div>
          {citasFueraRango.length > 0 && <div className={styles.fueraRango}>
            <p>Citas fuera del rango de la rejilla</p>
            {citasFueraRango.map((cita) => <button key={cita.id} type="button" onClick={() => seleccionarCita(cita.id)}>
              {new Date(cita.inicio).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })} · {cita.cliente_nombre} · {cita.servicio_nombre} · {cita.estado}
            </button>)}
          </div>}
        </div>

        <div className={styles.columnaPanel}>
          {seleccion === null && (
            <p className={styles.ayuda}>
              {puede("citas:gestionar")
                ? "Pulsa un hueco para crear una cita o una cita para verla."
                : "Pulsa una cita para verla."}
            </p>
          )}
          {seleccion && (
            <Panel
              key={
                seleccion.tipo === "cita"
                  ? `cita-${seleccion.id}`
                  : `hueco-${seleccion.inicio.toISOString()}`
              }
              seleccion={seleccion}
              semanaHorario={semanaHorario}
              consultarSemana={consultarSemana}
              clientes={clientes}
              servicios={servicios}
              citaSeleccionada={citaSeleccionada}
              error={error}
              onCrear={crearCita}
              onCrearCliente={crearCliente}
              onCancelar={cancelarCita}
              onCompletar={completarCita}
              onMover={moverCita}
              onCerrar={() => {
                setError(null);
                setSeleccion(null);
              }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

export default Calendario;
