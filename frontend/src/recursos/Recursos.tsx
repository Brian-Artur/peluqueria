import { useEffect, useState, type ReactElement } from "react";
import { z } from "zod";
import {
  esquemaRecurso, esquemaTipoRecurso, type DatosRecurso, type DatosTipoRecurso,
  type Recurso, type TipoRecurso,
} from "@peluqueria/compartido";
import { esAbortada, mensajeDeError, pedir, pedirJson } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import GestionTipos from "./GestionTipos";
import ListaRecursos from "./ListaRecursos";
import FichaRecurso from "./FichaRecurso";
import styles from "./Recursos.module.css";

function Recursos(): ReactElement {
  const { puede } = useSesion();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [tipos, setTipos] = useState<TipoRecurso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recargas, setRecargas] = useState(0);
  const [mostrarBajas, setMostrarBajas] = useState(false);
  const [seleccion, setSeleccion] = useState<number | "nuevo" | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    const cargar = async (): Promise<void> => {
      setCargando(true);
      try {
        const [lista, tiposRecibidos] = await Promise.all([
          pedirJson("/api/recursos?incluirInactivos=true", z.array(esquemaRecurso), { signal: controlador.signal }),
          pedirJson("/api/tipos-recurso?incluirInactivos=true", z.array(esquemaTipoRecurso), { signal: controlador.signal }),
        ]);
        controlador.signal.throwIfAborted();
        setRecursos(lista);
        setTipos(tiposRecibidos);
        setCargado(true);
        setError(null);
      } catch (fallo) {
        if (esAbortada(fallo)) return;
        setError(`No se pudieron cargar los recursos: ${mensajeDeError(fallo)}`);
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    };
    void cargar();
    return () => controlador.abort();
  }, [recargas]);

  const guardarTipo = async (id: number | null, datos: DatosTipoRecurso): Promise<void> => {
    if (!puede("local:gestionar")) return;
    const opciones: RequestInit = {
      method: id === null ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
    };
    if (id === null) await pedirJson("/api/tipos-recurso", esquemaTipoRecurso.pick({ id: true }), opciones);
    else await pedir(`/api/tipos-recurso/${id}`, opciones);
    setRecargas((n) => n + 1);
  };

  const guardarRecurso = async (datos: DatosRecurso): Promise<void> => {
    if (!puede("local:gestionar") || seleccion === null) return;
    const opciones: RequestInit = {
      method: seleccion === "nuevo" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos),
    };
    if (seleccion === "nuevo") {
      const creado = await pedirJson("/api/recursos", esquemaRecurso.pick({ id: true }), opciones);
      setSeleccion(creado.id);
    } else {
      await pedir(`/api/recursos/${seleccion}`, opciones);
    }
    setRecargas((n) => n + 1);
  };

  const recurso = recursos.find((elemento) => elemento.id === seleccion) ?? null;
  let ficha = <p className={styles.ayuda}>Elige un recurso para ver su ficha.</p>;
  if (seleccion === "nuevo" && puede("local:gestionar")) {
    ficha = <FichaRecurso key="nuevo" recurso={null} tipos={tipos} onGuardar={guardarRecurso} />;
  } else if (recurso !== null) {
    ficha = <FichaRecurso key={recurso.id} recurso={recurso} tipos={tipos} onGuardar={guardarRecurso} />;
  }

  return (
    <div className={styles.recursos}>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      {cargando && <p role="status" className={styles.ayuda}>Cargando recursos…</p>}
      {cargado && <>
        <GestionTipos tipos={tipos} onGuardar={guardarTipo} />
        <div className={styles.distribucion}>
          <div className={styles.lista}>
            <div className={styles.herramientas}>
              <label><input type="checkbox" checked={mostrarBajas}
                onChange={(evento) => setMostrarBajas(evento.target.checked)} /> Mostrar dados de baja</label>
              {puede("local:gestionar") && <button type="button" className={styles.principal}
                onClick={() => setSeleccion("nuevo")}>Nuevo recurso</button>}
            </div>
            <ListaRecursos recursos={recursos} mostrarBajas={mostrarBajas} seleccion={seleccion} onSeleccionar={setSeleccion} />
          </div>
          <aside className={styles.ficha} aria-label="Ficha del recurso">{ficha}</aside>
        </div>
      </>}
    </div>
  );
}

export default Recursos;
