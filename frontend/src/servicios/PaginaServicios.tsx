import { useEffect, useState, type ReactElement } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { z } from "zod";
import {
  esquemaCategoria, esquemaServicio, type Categoria, type DatosCategoria, type DatosServicio, type Servicio,
} from "@peluqueria/compartido";
import { esAbortada, mensajeDeError, pedir, pedirJson } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import FichaServicio from "./FichaServicio";
import ListaServicios from "./ListaServicios";
import GestionCategorias from "./GestionCategorias";
import styles from "./PaginaServicios.module.css";

type Props = { nuevo?: boolean };
type DetalleServicio = { id: string; servicio: Servicio | null; error: string | null };

function PaginaServicios({ nuevo = false }: Props): ReactElement {
  const { puede } = useSesion();
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [catalogoCargado, setCatalogoCargado] = useState(false);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetalleServicio | null>(null);
  const [recargas, setRecargas] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    const cargar = async (): Promise<void> => {
      setCargando(true);
      try {
        const [lista, categoriasRecibidas] = await Promise.all([
          pedirJson("/api/servicios?incluirInactivos=true", z.array(esquemaServicio), { signal: controlador.signal }),
          pedirJson("/api/categorias", z.array(esquemaCategoria), { signal: controlador.signal }),
        ]);
        controlador.signal.throwIfAborted();
        setServicios(lista);
        setCategorias(categoriasRecibidas);
        setCatalogoCargado(true);
        setErrorLista(null);
      } catch (fallo) {
        if (esAbortada(fallo)) return;
        setErrorLista(`No se pudo cargar el catálogo: ${mensajeDeError(fallo)}`);
      } finally {
        if (!controlador.signal.aborted) setCargando(false);
      }
    };
    void cargar();
    return () => controlador.abort();
  }, [recargas]);

  useEffect(() => {
    if (id === undefined) return;
    const controlador = new AbortController();
    pedirJson(`/api/servicios/${encodeURIComponent(id)}`, esquemaServicio, { signal: controlador.signal })
      .then((servicio) => {
        if (!controlador.signal.aborted) setDetalle({ id, servicio, error: null });
      })
      .catch((fallo) => {
        if (esAbortada(fallo)) return;
        setDetalle({ id, servicio: null, error: `No se pudo abrir el servicio: ${mensajeDeError(fallo)}` });
      });
    return () => controlador.abort();
  }, [id]);

  const guardarServicio = async (datos: DatosServicio): Promise<boolean> => {
    if (!puede("servicios:gestionar")) return false;
    const opciones: RequestInit = {
      method: nuevo ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    };
    if (nuevo) {
      const creado = await pedirJson("/api/servicios", esquemaServicio.pick({ id: true }), opciones);
      setRecargas((n) => n + 1);
      await navegar(`/servicios/${creado.id}`, { replace: true });
      return true;
    }
    if (id === undefined) return false;
    await pedir(`/api/servicios/${encodeURIComponent(id)}`, opciones);
    setDetalle((anterior) => {
      if (anterior?.id !== id || anterior.servicio === null) return anterior;
      const categoria = categorias.find((elemento) => elemento.id === datos.categoria_id);
      return { id, error: null, servicio: { ...anterior.servicio, ...datos, categoria_nombre: categoria?.nombre ?? null } };
    });
    setRecargas((n) => n + 1);
    return true;
  };

  const guardarCategoria = async (categoriaId: number | null, datos: DatosCategoria): Promise<void> => {
    if (!puede("servicios:gestionar")) return;
    const opciones: RequestInit = {
      method: categoriaId === null ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    };
    if (categoriaId === null) {
      await pedirJson("/api/categorias", esquemaCategoria.pick({ id: true }), opciones);
    } else {
      await pedir(`/api/categorias/${categoriaId}`, opciones);
    }
    setRecargas((n) => n + 1);
  };

  if (!puede("citas:ver")) return <Navigate to="/agenda" replace />;
  if (nuevo && !puede("servicios:gestionar")) return <Navigate to="/servicios" replace />;

  let ficha: ReactElement = <p className={styles.ayuda}>Elige un servicio para ver su ficha.</p>;
  if (nuevo && catalogoCargado) {
    ficha = <FichaServicio key="nuevo" servicio={null} categorias={categorias} onGuardar={guardarServicio} />;
  } else if (id !== undefined) {
    if (detalle?.id !== id || !catalogoCargado) {
      ficha = <p role="status" className={styles.ayuda}>Cargando servicio…</p>;
    } else if (detalle.error !== null) {
      ficha = <p role="alert" className={styles.error}>{detalle.error}</p>;
    } else if (detalle.servicio !== null) {
      ficha = <FichaServicio key={id} servicio={detalle.servicio} categorias={categorias} onGuardar={guardarServicio} />;
    }
  }

  return (
    <section className={styles.pagina}>
      <h1 className={styles.titulo}>Servicios</h1>
      {errorLista !== null && <p role="alert" className={styles.error}>{errorLista}</p>}
      {cargando && <p role="status" className={styles.ayuda}>Cargando catálogo…</p>}
      {catalogoCargado && <GestionCategorias categorias={categorias} onGuardar={guardarCategoria} />}
      <div className={styles.distribucion}>
        <div className={styles.lista}>
          <div className={styles.herramientas}>
            {puede("servicios:gestionar") && <Link className={styles.principal} to="/servicios/nuevo">Nuevo servicio</Link>}
          </div>
          <ListaServicios servicios={servicios} servicioId={id === undefined ? null : Number(id)} />
          {!cargando && errorLista === null && servicios.length === 0 && <p className={styles.ayuda}>No hay servicios.</p>}
        </div>
        <aside className={styles.columnaFicha} aria-label="Ficha del servicio">{ficha}</aside>
      </div>
    </section>
  );
}

export default PaginaServicios;
