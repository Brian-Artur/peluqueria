import { useEffect, useState, type ReactElement } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { z } from "zod";
import { esquemaCliente, type Cliente, type DatosCliente } from "@peluqueria/compartido";
import { esAbortada, mensajeDeError, pedir, pedirJson } from "../peticion";
import FichaCliente from "./FichaCliente";
import ListaClientes from "./ListaClientes";
import { useSesion } from "../sesion/useSesion";
import styles from "./PaginaClientes.module.css";

type Props = { nuevo?: boolean };
type DetalleCliente = {
  id: string;
  cliente: Cliente | null;
  error: string | null;
};

function PaginaClientes({ nuevo = false }: Props): ReactElement {
  const { puede } = useSesion();
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [buscar, setBuscar] = useState("");
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<DetalleCliente | null>(null);
  // Sube tras guardar para que el efecto de la lista vuelva a pedirla al servidor.
  const [recargas, setRecargas] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    const { signal } = controlador;
    const parametros = new URLSearchParams({ buscar });

    // Esperar 300 ms tras la última tecla evita una petición por letra.
    const temporizador = setTimeout(async () => {
      setCargandoLista(true);
      try {
        const lista = await pedirJson(`/api/clientes?${parametros}`, z.array(esquemaCliente), { signal });
        setClientes(lista);
        setErrorLista(null);
      } catch (fallo) {
        if (esAbortada(fallo)) return;
        setErrorLista(`No se pudieron cargar los clientes: ${mensajeDeError(fallo)}`);
      }
      if (!signal.aborted) setCargandoLista(false);
    }, 300);

    // Al cambiar el texto (o al salir), la petición anterior se cancela: no puede pisar a la nueva.
    return () => {
      clearTimeout(temporizador);
      controlador.abort();
    };
  }, [buscar, recargas]);

  useEffect(() => {
    if (id === undefined) return;
    const controlador = new AbortController();
    pedirJson(`/api/clientes/${encodeURIComponent(id)}`, esquemaCliente, { signal: controlador.signal })
      .then((cliente) => setDetalle({ id, cliente, error: null }))
      .catch((fallo) => {
        if (esAbortada(fallo)) return;
        setDetalle({ id, cliente: null, error: `No se pudo abrir el cliente: ${mensajeDeError(fallo)}` });
      });
    return () => { controlador.abort(); };
  }, [id]);

  const guardarCliente = async (datos: DatosCliente): Promise<boolean> => {
    if (!puede("clientes:gestionar")) return false;
    const opciones: RequestInit = {
      method: nuevo ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    };

    if (nuevo) {
      const creado = await pedirJson("/api/clientes", esquemaCliente.pick({ id: true }), opciones);
      setRecargas((n) => n + 1);
      await navegar(`/clientes/${creado.id}`, { replace: true });
      return true;
    }

    if (id === undefined) return false;
    await pedir(`/api/clientes/${encodeURIComponent(id)}`, opciones);
    setRecargas((n) => n + 1);
    return true;
  };

  if (nuevo && !puede("clientes:gestionar")) return <Navigate to="/clientes" replace />;

  let ficha: ReactElement = (
    <p className={styles.ayuda}>
      {puede("clientes:gestionar") ? "Elige un cliente o crea uno nuevo." : "Elige un cliente para ver su ficha."}
    </p>
  );
  if (nuevo) {
    ficha = <FichaCliente key="nuevo" cliente={null} onGuardar={guardarCliente} />;
  } else if (id !== undefined) {
    if (detalle?.id !== id) {
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
                onChange={(evento) => setBuscar(evento.target.value)}
                placeholder="Nombre, teléfono o email"
              />
            </label>
            {puede("clientes:gestionar") && <Link className={styles.principal} to="/clientes/nuevo">Nuevo cliente</Link>}
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
