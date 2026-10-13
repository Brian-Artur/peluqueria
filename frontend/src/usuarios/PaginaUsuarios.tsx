import { useEffect, useRef, useState, type ReactElement } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { esquemaUsuario, type CrearUsuario, type EditarUsuario, type Usuario } from "@peluqueria/compartido";
import { esAbortada, mensajeDeError, pedir, pedirJson } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import ListaUsuarios from "./ListaUsuarios";
import FichaUsuario from "./FichaUsuario";
import styles from "./PaginaUsuarios.module.css";

type Props = { nuevo?: boolean };
type DetalleUsuario = { id: string; usuario: Usuario | null; error: string | null };

export default function PaginaUsuarios({ nuevo = false }: Props): ReactElement {
  const { usuario: conectado, puede, refrescar } = useSesion();
  const puedeGestionar = puede("usuarios:gestionar");
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetalleUsuario | null>(null);
  const [recargas, setRecargas] = useState(0);
  const mutaciones = useRef<AbortController | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    mutaciones.current = controlador;
    return () => { controlador.abort(); };
  }, [id, nuevo]);

  useEffect(() => {
    if (!puedeGestionar) return;
    const controlador = new AbortController();
    const { signal } = controlador;
    const cargar = async (): Promise<void> => {
      setCargandoLista(true);
      try {
        const lista = await pedirJson("/api/usuarios", z.array(esquemaUsuario), { signal });
        if (signal.aborted) return;
        setUsuarios(lista);
        setErrorLista(null);
      } catch (fallo) {
        if (signal.aborted || esAbortada(fallo)) return;
        setErrorLista(`No se pudieron cargar los usuarios: ${mensajeDeError(fallo)}`);
      } finally {
        if (!signal.aborted) setCargandoLista(false);
      }
    };
    void cargar();
    return () => { controlador.abort(); };
  }, [puedeGestionar, recargas]);

  useEffect(() => {
    if (!puedeGestionar || id === undefined || nuevo) return;
    const controlador = new AbortController();
    const { signal } = controlador;
    pedirJson(`/api/usuarios/${encodeURIComponent(id)}`, esquemaUsuario, { signal })
      .then((usuario) => {
        if (!signal.aborted) setDetalle({ id, usuario, error: null });
      })
      .catch((fallo: unknown) => {
        if (signal.aborted || esAbortada(fallo)) return;
        setDetalle({ id, usuario: null, error: `No se pudo abrir el usuario: ${mensajeDeError(fallo)}` });
      });
    return () => { controlador.abort(); };
  }, [id, nuevo, puedeGestionar]);

  const crearUsuario = async (datos: CrearUsuario): Promise<void> => {
    if (!puedeGestionar || !nuevo) return;
    const signal = mutaciones.current?.signal;
    const creado = await pedirJson("/api/usuarios", esquemaUsuario.pick({ id: true }), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos), signal,
    });
    signal?.throwIfAborted();
    setRecargas((n) => n + 1);
    await navegar(`/usuarios/${creado.id}`, { replace: true });
  };

  const editarUsuario = async (datos: EditarUsuario): Promise<Usuario> => {
    if (!puedeGestionar || id === undefined) throw new Error("No puedes guardar este usuario");
    const signal = mutaciones.current?.signal;
    const url = `/api/usuarios/${encodeURIComponent(id)}`;
    await pedir(url, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos), signal,
    });
    signal?.throwIfAborted();
    setRecargas((n) => n + 1);
    const actualizado = await pedirJson(url, esquemaUsuario, { signal });
    signal?.throwIfAborted();
    setDetalle({ id, usuario: actualizado, error: null });
    if (actualizado.id === conectado?.id) await refrescar(signal);
    return actualizado;
  };

  const ponerContrasena = async (contrasena: string): Promise<void> => {
    if (!puedeGestionar || id === undefined) return;
    const signal = mutaciones.current?.signal;
    await pedir(`/api/usuarios/${encodeURIComponent(id)}/contrasena`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contrasena }), signal,
    });
    signal?.throwIfAborted();
    // La operación administrativa también expulsa al admin si se aplica a sí mismo.
    if (Number(id) === conectado?.id) {
      await refrescar(signal);
    }
  };

  if (!puedeGestionar) return <Navigate to="/agenda" replace />;

  let ficha: ReactElement = <p className={styles.ayuda}>Elige un usuario o crea uno nuevo.</p>;
  if (nuevo) {
    ficha = <FichaUsuario key="nuevo" usuario={null} onCrear={crearUsuario} onEditar={editarUsuario} onContrasena={ponerContrasena} />;
  } else if (id !== undefined) {
    if (detalle?.id !== id) {
      ficha = <p role="status" className={styles.ayuda}>Cargando usuario…</p>;
    } else if (detalle.error !== null) {
      ficha = <p role="alert" className={styles.error}>{detalle.error}</p>;
    } else if (detalle.usuario !== null) {
      ficha = <FichaUsuario key={id} usuario={detalle.usuario} onCrear={crearUsuario} onEditar={editarUsuario} onContrasena={ponerContrasena} />;
    }
  }

  return (
    <section className={styles.pagina}>
      <h1 className={styles.titulo}>Usuarios</h1>
      <div className={styles.distribucion}>
        <div className={styles.lista}>
          <div className={styles.herramientas}>
            {puedeGestionar && <Link to="/usuarios/nuevo" className={styles.principal}>Nuevo usuario</Link>}
          </div>
          {errorLista !== null && <p role="alert" className={styles.error}>{errorLista}</p>}
          {cargandoLista && <p role="status" className={styles.ayuda}>Cargando usuarios…</p>}
          {usuarios.length > 0 && <ListaUsuarios usuarios={usuarios} usuarioId={id === undefined ? null : Number(id)} />}
          {!cargandoLista && errorLista === null && usuarios.length === 0 && <p className={styles.ayuda}>No hay usuarios.</p>}
        </div>
        <aside className={styles.columnaFicha} aria-label="Ficha del usuario">{ficha}</aside>
      </div>
    </section>
  );
}
