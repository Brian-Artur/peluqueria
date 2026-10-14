import { useEffect, useRef, useState, type ReactElement } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { z } from "zod";
import {
  esquemaEmpleado, esquemaEmpleadoResumen, esquemaServicio, esquemaCategoria, esquemaUsuario,
  esquemaTiempoEmpleado, esquemaCambioTiempo,
  type Baja, type Competencias, type CrearEmpleado, type DatosEmpleado as Datos,
  type Empleado, type EmpleadoResumen, type NuevoContrato, type Servicio, type Usuario,
  type CambioTiempo, type DatosTiempo, type TiempoEmpleado,
} from "@peluqueria/compartido";
import { esAbortada, mensajeDeError, pedir, pedirJson } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import DatosEmpleado from "./DatosEmpleado";
import ContratosEmpleado from "./ContratosEmpleado";
import CompetenciasEmpleado from "./CompetenciasEmpleado";
import TiemposEmpleado from "./TiemposEmpleado";
import ListaEmpleados from "./ListaEmpleados";
import styles from "./PaginaEmpleados.module.css";

type Props = { nuevo?: boolean };
type Detalle = { id: string; empleado: Empleado | null; error: string | null; revision: number };
type DatosTiempos = { tiempos: TiempoEmpleado[]; historial: CambioTiempo[] };
type DetalleTiempos = DatosTiempos & { id: string; error: string | null; revision: number };

async function cargarTiempos(id: string, signal: AbortSignal): Promise<DatosTiempos> {
  const url = `/api/empleados/${encodeURIComponent(id)}/tiempos`;
  const [tiempos, historial] = await Promise.all([
    pedirJson(url, z.array(esquemaTiempoEmpleado), { signal }),
    pedirJson(`${url}/historial`, z.array(esquemaCambioTiempo), { signal }),
  ]);
  signal.throwIfAborted();
  return { tiempos, historial };
}

export default function PaginaEmpleados({ nuevo = false }: Props): ReactElement {
  const { puede } = useSesion();
  const puedeVer = puede("empleados:ver");
  const puedeGestionar = puede("empleados:gestionar");
  const puedeEnlazar = puede("usuarios:gestionar");
  const puedeVerTiempos = puede("rendimiento:ver");
  const puedeGestionarTiempos = puede("rendimiento:gestionar");
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const [empleados, setEmpleados] = useState<EmpleadoResumen[]>([]);
  const [mostrarBajas, setMostrarBajas] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [servicios, setServicios] = useState<Servicio[] | null>(null);
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [errorUsuarios, setErrorUsuarios] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [detalleTiempos, setDetalleTiempos] = useState<DetalleTiempos | null>(null);
  const [recargas, setRecargas] = useState(0);
  const [ocupado, setOcupado] = useState(false);
  const [confirmacion, setConfirmacion] = useState<{ id: string; mensaje: string } | null>(null);
  const mutaciones = useRef<AbortController | null>(null);
  const cargaTiempos = useRef<AbortController | null>(null);
  const escribiendo = useRef(false);

  useEffect(() => {
    const controlador = new AbortController();
    mutaciones.current = controlador;
    return () => controlador.abort();
  }, [id, nuevo, puedeGestionar, puedeVerTiempos, puedeGestionarTiempos]);

  useEffect(() => {
    if (!puedeVer) return;
    const controlador = new AbortController();
    const { signal } = controlador;
    const cargar = async (): Promise<void> => {
      setCargando(true);
      try {
        const url = mostrarBajas ? "/api/empleados?incluirInactivos=true" : "/api/empleados";
        const lista = await pedirJson(url, z.array(esquemaEmpleadoResumen), { signal });
        signal.throwIfAborted();
        setEmpleados(lista);
        setErrorLista(null);
      } catch (fallo) {
        if (!signal.aborted && !esAbortada(fallo)) setErrorLista(mensajeDeError(fallo));
      } finally {
        if (!signal.aborted) setCargando(false);
      }
    };
    void cargar();
    return () => controlador.abort();
  }, [puedeVer, mostrarBajas, recargas]);

  useEffect(() => {
    if (!puedeVer) return;
    const controlador = new AbortController();
    const { signal } = controlador;
    const cargar = async (): Promise<void> => {
      try {
        const [lista, categorias] = await Promise.all([
          pedirJson("/api/servicios", z.array(esquemaServicio), { signal }),
          pedirJson("/api/categorias", z.array(esquemaCategoria), { signal }),
        ]);
        signal.throwIfAborted();
        setServicios(lista.map((servicio) => ({
          ...servicio,
          categoria_nombre: categorias.find((categoria) => categoria.id === servicio.categoria_id)?.nombre ?? servicio.categoria_nombre,
        })));
        setErrorCatalogo(null);
      } catch (fallo) {
        if (!signal.aborted && !esAbortada(fallo)) setErrorCatalogo(mensajeDeError(fallo));
      }
    };
    void cargar();
    return () => controlador.abort();
  }, [puedeVer]);

  useEffect(() => {
    if (!puedeVer || !puedeEnlazar) return;
    const controlador = new AbortController();
    const { signal } = controlador;
    pedirJson("/api/usuarios", z.array(esquemaUsuario), { signal })
      .then((lista) => {
        if (signal.aborted) return;
        setUsuarios(lista);
        setErrorUsuarios(null);
      })
      .catch((fallo: unknown) => {
        if (!signal.aborted && !esAbortada(fallo)) setErrorUsuarios(`No se pudieron cargar los usuarios: ${mensajeDeError(fallo)}`);
      });
    return () => controlador.abort();
  }, [puedeVer, puedeEnlazar]);

  useEffect(() => {
    if (!puedeVer || id === undefined || nuevo) return;
    const controlador = new AbortController();
    const { signal } = controlador;
    pedirJson(`/api/empleados/${encodeURIComponent(id)}`, esquemaEmpleado, { signal })
      .then((empleado) => {
        if (!signal.aborted) setDetalle({ id, empleado, error: null, revision: 0 });
      })
      .catch((fallo: unknown) => {
        if (!signal.aborted && !esAbortada(fallo)) setDetalle({ id, empleado: null, error: mensajeDeError(fallo), revision: 0 });
      });
    return () => controlador.abort();
  }, [id, nuevo, puedeVer]);

  useEffect(() => {
    if (!puedeVer || !puedeVerTiempos || id === undefined || nuevo) return;
    const controlador = new AbortController();
    cargaTiempos.current = controlador;
    const { signal } = controlador;
    cargarTiempos(id, signal)
      .then((datos) => {
        if (!signal.aborted) setDetalleTiempos({ id, ...datos, error: null, revision: 0 });
      })
      .catch((fallo: unknown) => {
        if (!signal.aborted && !esAbortada(fallo)) {
          setDetalleTiempos({ id, tiempos: [], historial: [], error: mensajeDeError(fallo), revision: 0 });
        }
      });
    return () => controlador.abort();
  }, [id, nuevo, puedeVer, puedeVerTiempos]);

  const refrescarTiempos = async (empleadoId: string, signal: AbortSignal): Promise<void> => {
    // La carga inicial no debe sobrescribir los tiempos que acabamos de guardar.
    cargaTiempos.current?.abort();
    try {
      const datos = await cargarTiempos(empleadoId, signal);
      setDetalleTiempos((anterior) => ({
        id: empleadoId, ...datos, error: null, revision: (anterior?.revision ?? 0) + 1,
      }));
    } catch (fallo) {
      if (signal.aborted || esAbortada(fallo)) throw fallo;
      const mensaje = `Los cambios se guardaron, pero no se pudieron refrescar los tiempos: ${mensajeDeError(fallo)}. Recarga la ficha.`;
      setDetalleTiempos({ id: empleadoId, tiempos: [], historial: [], error: mensaje, revision: 0 });
      throw new Error(mensaje, { cause: fallo });
    }
  };

  const crear = async (datos: CrearEmpleado): Promise<void> => {
    if (!puedeGestionar || !nuevo || escribiendo.current) return;
    const signal = mutaciones.current?.signal;
    escribiendo.current = true;
    setOcupado(true);
    try {
      const creado = await pedirJson("/api/empleados", esquemaEmpleado.pick({ id: true }), {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos), signal,
      });
      signal?.throwIfAborted();
      setRecargas((n) => n + 1);
      await navegar(`/empleados/${creado.id}`, { replace: true });
    } finally {
      escribiendo.current = false;
      setOcupado(false);
    }
  };

  const escribir = async (sufijo: string, metodo: string, datos: unknown): Promise<void> => {
    if (!puedeGestionar || id === undefined || escribiendo.current) return;
    const signal = mutaciones.current?.signal;
    const url = `/api/empleados/${encodeURIComponent(id)}`;
    escribiendo.current = true;
    setOcupado(true);
    setConfirmacion(null);
    try {
      await pedir(url + sufijo, {
        method: metodo, headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos), signal,
      });
      signal?.throwIfAborted();
      setRecargas((n) => n + 1);
      const actualizado = await pedirJson(url, esquemaEmpleado, { signal });
      signal?.throwIfAborted();
      if (sufijo === "/competencias" && puedeVerTiempos && signal !== undefined) {
        await refrescarTiempos(id, signal);
      }
      setDetalle((anterior) => ({ id, empleado: actualizado, error: null, revision: (anterior?.revision ?? 0) + 1 }));
      setConfirmacion({ id, mensaje: "Cambios guardados." });
    } finally {
      escribiendo.current = false;
      setOcupado(false);
    }
  };
  const guardarDatos = (datos: Datos): Promise<void> => escribir("", "PATCH", datos);
  const nuevoContrato = (datos: NuevoContrato): Promise<void> => escribir("/contratos", "POST", datos);
  const darDeBaja = (datos: Baja): Promise<void> => escribir("/baja", "POST", datos);
  const guardarCompetencias = (datos: Competencias): Promise<void> => escribir("/competencias", "PUT", datos);

  const guardarTiempo = async (servicioId: number, datos: DatosTiempo): Promise<void> => {
    const signal = mutaciones.current?.signal;
    if (!puedeGestionarTiempos || id === undefined || signal === undefined || escribiendo.current) return;
    escribiendo.current = true;
    setOcupado(true);
    setConfirmacion(null);
    try {
      await pedir(`/api/empleados/${encodeURIComponent(id)}/tiempos/${servicioId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos), signal,
      });
      signal.throwIfAborted();
      await refrescarTiempos(id, signal);
      setConfirmacion({ id, mensaje: "Tiempos guardados." });
    } finally {
      escribiendo.current = false;
      setOcupado(false);
    }
  };

  if (!puedeVer) return <Navigate to="/agenda" replace />;
  if (nuevo && !puedeGestionar) return <Navigate to="/empleados" replace />;

  let ficha: ReactElement = <p className={styles.ayuda}>Elige un empleado para ver su ficha.</p>;
  if (nuevo) {
    ficha = <DatosEmpleado key="nuevo" empleado={null} empleados={empleados} usuarios={usuarios} errorUsuarios={errorUsuarios}
      ocupado={ocupado || cargando || errorLista !== null} onCrear={crear} onGuardar={guardarDatos} />;
  } else if (id !== undefined) {
    if (detalle?.id !== id) {
      ficha = <p role="status" className={styles.ayuda}>Cargando empleado…</p>;
    } else if (detalle.error !== null) {
      ficha = <p role="alert" className={styles.error}>{detalle.error}</p>;
    } else if (detalle.empleado !== null) {
      const empleado = detalle.empleado;
      const bloqueado = ocupado || cargando || errorLista !== null;
      let seccionTiempos: ReactElement | null = null;
      if (puedeVerTiempos) {
        if (detalleTiempos?.id !== id) {
          seccionTiempos = <p role="status" className={styles.ayuda}>Cargando tiempos…</p>;
        } else if (detalleTiempos.error !== null) {
          seccionTiempos = <p role="alert" className={styles.error}>No se pudieron cargar los tiempos: {detalleTiempos.error}</p>;
        } else {
          seccionTiempos = <TiemposEmpleado tiempos={detalleTiempos.tiempos} historial={detalleTiempos.historial}
            revision={detalleTiempos.revision} ocupado={bloqueado} onGuardar={guardarTiempo} />;
        }
      }
      // Reiniciar los formularios con la ficha recibida evita conservar valores anteriores al guardado.
      ficha = <div key={`${id}-${detalle.revision}`} className={styles.ficha}>
        <DatosEmpleado empleado={empleado} empleados={empleados} usuarios={usuarios} errorUsuarios={errorUsuarios}
          ocupado={bloqueado} onCrear={crear} onGuardar={guardarDatos} />
        <ContratosEmpleado empleado={empleado} empleados={empleados} ocupado={bloqueado} onContrato={nuevoContrato} onBaja={darDeBaja} />
        {servicios === null ? <p className={styles.ayuda}>Las competencias necesitan el catálogo de servicios.</p> :
          <CompetenciasEmpleado empleado={empleado} servicios={servicios} ocupado={bloqueado} onGuardar={guardarCompetencias} />}
        {seccionTiempos}
      </div>;
    }
  }

  return (
    <section className={styles.pagina}>
      <h1 className={styles.titulo}>Empleados</h1>
      <div className={styles.herramientas}>
        {puedeGestionar && <Link className={styles.principal} to="/empleados/nuevo">Nuevo empleado</Link>}
        <Link className={styles.enlace} to="/empleados/cuadro">Ver cuadro de competencias</Link>
        <label><input type="checkbox" checked={mostrarBajas} disabled={ocupado}
          onChange={(evento) => setMostrarBajas(evento.target.checked)} /> Mostrar de baja</label>
      </div>
      {errorCatalogo !== null && <p role="alert" className={styles.error}>No se pudo cargar el catálogo: {errorCatalogo}</p>}
      <div className={styles.distribucion}>
        <div className={styles.lista}>
          {errorLista !== null && <p role="alert" className={styles.error}>No se pudieron cargar los empleados: {errorLista}</p>}
          {cargando && <p role="status" className={styles.ayuda}>Cargando empleados…</p>}
          <ListaEmpleados empleados={empleados} empleadoId={id === undefined ? null : Number(id)} />
          {!cargando && errorLista === null && empleados.length === 0 && <p className={styles.ayuda}>No hay empleados.</p>}
        </div>
        <aside className={styles.columnaFicha} aria-label="Ficha del empleado">
          {confirmacion !== null && confirmacion.id === id && !ocupado && <p role="status" className={styles.confirmacion}>{confirmacion.mensaje}</p>}
          {ficha}
        </aside>
      </div>
    </section>
  );
}
