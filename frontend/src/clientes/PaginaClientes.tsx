import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { esquemaCliente, type Cliente, type DatosCliente } from "@peluqueria/compartido";
import { mensajeDeError, pedir, pedirJson } from "../peticion";
import FichaCliente from "./FichaCliente";
import ListaClientes from "./ListaClientes";
import styles from "./PaginaClientes.module.css";

type Props = { nuevo?: boolean };
type DetalleCliente = {
  claveRuta: string;
  cliente: Cliente | null;
  error: string | null;
};

function PaginaClientes({ nuevo = false }: Props): ReactElement {
  const { id } = useParams<{ id: string }>();
  const { key: claveRuta } = useLocation();
  const navegar = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscar, setBuscar] = useState("");
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetalleCliente | null>(null);
  const busquedaActual = useRef("");
  const versionLista = useRef(0);
  const versionFicha = useRef(0);
  const paginaActiva = useRef(false);

  useEffect(() => {
    paginaActiva.current = true;
    return () => { paginaActiva.current = false; };
  }, []);

  const refrescarLista = useCallback(async (): Promise<void> => {
    const version = ++versionLista.current;
    const parametros = new URLSearchParams({ buscar: busquedaActual.current });
    setCargandoLista(true);
    try {
      const lista = await pedirJson(`/api/clientes?${parametros}`, z.array(esquemaCliente));
      if (version !== versionLista.current) return;
      setClientes(lista);
      setErrorLista(null);
    } catch (fallo) {
      if (version !== versionLista.current) return;
      setErrorLista(`No se pudieron cargar los clientes: ${mensajeDeError(fallo)}`);
    } finally {
      if (version === versionLista.current) setCargandoLista(false);
    }
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => { void refrescarLista(); }, 300);
    return () => {
      clearTimeout(temporizador);
      // También invalida las respuestas al salir de la pantalla.
      versionLista.current += 1;
    };
  }, [buscar, refrescarLista]);

  useEffect(() => {
    const version = ++versionFicha.current;
    if (id !== undefined) {
      pedirJson(`/api/clientes/${encodeURIComponent(id)}`, esquemaCliente)
        .then((cliente) => {
          if (version !== versionFicha.current) return;
          setDetalle({ claveRuta, cliente, error: null });
        })
        .catch((fallo) => {
          if (version !== versionFicha.current) return;
          setDetalle({ claveRuta, cliente: null, error: `No se pudo abrir el cliente: ${mensajeDeError(fallo)}` });
        });
    }
    return () => { versionFicha.current += 1; };
  }, [id, claveRuta]);

  const cambiarBusqueda = (texto: string): void => {
    // Invalidar al teclear evita que una petición previa aparezca durante la espera.
    versionLista.current += 1;
    busquedaActual.current = texto;
    setBuscar(texto);
  };

  const guardarCliente = async (datos: DatosCliente): Promise<boolean> => {
    const version = versionFicha.current;
    let idNuevo: number | null = null;
    const opciones: RequestInit = {
      method: nuevo ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    };

    if (nuevo) {
      const creado = await pedirJson("/api/clientes", esquemaCliente.pick({ id: true }), opciones);
      idNuevo = creado.id;
    } else {
      if (id === undefined) return false;
      await pedir(`/api/clientes/${encodeURIComponent(id)}`, opciones);
    }

    if (!paginaActiva.current) return false;
    await refrescarLista();
    // Si se cambió de ficha mientras se guardaba, no forzar otra navegación.
    if (version !== versionFicha.current) return false;
    if (idNuevo !== null) await navegar(`/clientes/${idNuevo}`, { replace: true });
    return true;
  };

  let ficha: ReactElement = <p className={styles.ayuda}>Elige un cliente o crea uno nuevo.</p>;
  if (nuevo) {
    ficha = <FichaCliente key="nuevo" cliente={null} onGuardar={guardarCliente} />;
  } else if (id !== undefined) {
    if (detalle?.claveRuta !== claveRuta) {
      ficha = <p className={styles.ayuda} role="status">Cargando cliente…</p>;
    } else if (detalle.error !== null) {
      ficha = <p className={styles.error} role="alert">{detalle.error}</p>;
    } else if (detalle.cliente !== null) {
      ficha = <FichaCliente key={id} cliente={detalle.cliente} onGuardar={guardarCliente} />;
    }
  }

  return (
    <section className={styles.pagina}>
      <h1 className={styles.titulo}>Clientes</h1>
      <div className={styles.distribucion}>
        <div className={styles.lista}>
          <div className={styles.herramientas}>
            <label className={styles.buscador}>
              Buscar clientes
              <input
                type="search"
                value={buscar}
                onChange={(evento) => cambiarBusqueda(evento.target.value)}
                placeholder="Nombre, teléfono o email"
              />
            </label>
            <Link className={styles.principal} to="/clientes/nuevo">Nuevo cliente</Link>
          </div>
          {errorLista !== null && <p role="alert" className={styles.error}>{errorLista}</p>}
          {cargandoLista && <p role="status" className={styles.ayuda}>Cargando clientes…</p>}
          {clientes.length > 0 && <ListaClientes clientes={clientes} clienteId={id === undefined ? null : Number(id)} />}
          {!cargandoLista && errorLista === null && clientes.length === 0 && (
            <p className={styles.ayuda}>No hay clientes que coincidan</p>
          )}
        </div>
        <aside className={styles.columnaFicha} aria-label="Ficha del cliente">{ficha}</aside>
      </div>
    </section>
  );
}

export default PaginaClientes;
