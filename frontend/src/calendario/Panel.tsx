import { useId, useState, type FormEvent, type ReactElement } from "react";
import { esquemaDatosCliente, normalizarTelefono, type CountryCode, type DatosCliente } from "@peluqueria/compartido";
import type { Seleccion, Cliente, Servicio, Cita } from "../tipos";
import { erroresDeCliente, type ErroresCliente, type FormularioCliente } from "../clientes/erroresCliente";
import CampoTelefono from "../clientes/CampoTelefono";
import SelectorFechaHora from "./SelectorFechaHora";
import styles from "./Panel.module.css";

type Props = {
  seleccion: Seleccion;
  clientes: Cliente[];
  servicios: Servicio[];
  citaSeleccionada: Cita | null;
  error: string | null;
  onCrear: (clienteId: number, servicioId: number, inicio: Date) => void;
  onCrearCliente: (datos: DatosCliente) => Promise<number | null>;
  onCancelar: (id: number) => void;
  onCompletar: (id: number) => void;
  onMover: (id: number, inicio: string) => void;
  onCerrar: () => void;
};

function Panel({
  seleccion,
  clientes,
  servicios,
  citaSeleccionada,
  error,
  onCrear,
  onCrearCliente,
  onCancelar,
  onCompletar,
  onMover,
  onCerrar
}: Props): ReactElement {

  const [clienteId, setClienteId] = useState<number | null>(null);
  const prefijo = useId();
  const [altaRapida, setAltaRapida] = useState(false);
  const [datosCliente, setDatosCliente] = useState<FormularioCliente>({ nombre: "", telefono: "" });
  const [pais, setPais] = useState<CountryCode>("ES");
  const [erroresCliente, setErroresCliente] = useState<ErroresCliente>({});
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [inicio, setInicio] = useState<Date>(() => {
    if (seleccion.tipo === "hueco") return seleccion.inicio;
    return new Date(citaSeleccionada?.inicio ?? Date.now());
  });
  const [nuevoInicio, setNuevoInicio] = useState<Date>(
    () => new Date(citaSeleccionada?.inicio ?? Date.now())
  );

  const crearCliente = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (creandoCliente) return;
    const numero = datosCliente.telefono ?? "";
    const telefono = normalizarTelefono(numero, pais) ?? numero;
    const resultado = esquemaDatosCliente.safeParse({ ...datosCliente, telefono });
    if (!resultado.success) {
      setErroresCliente(erroresDeCliente(resultado.error.issues));
      return;
    }
    setErroresCliente({});
    setCreandoCliente(true);
    try {
      const id = await onCrearCliente(resultado.data);
      if (id === null) return;
      setClienteId(id);
      setAltaRapida(false);
      setDatosCliente({ nombre: "", telefono: "" });
      setPais("ES");
    } finally {
      setCreandoCliente(false);
    }
  };

  return (
    <div className={styles.panel}>
      <button className={styles.cerrar} aria-label="Cerrar" onClick={onCerrar}>×</button>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}

      {seleccion.tipo === "hueco" && (
        <div>
          <p className={styles.titulo}>Nueva cita</p>
          <SelectorFechaHora valor={inicio} onCambiar={setInicio} />

          <select
            className={styles.campo}
            aria-label="Cliente"
            value={altaRapida ? "nuevo" : clienteId ?? ""}
            disabled={creandoCliente}
            onChange={(evento) => {
              if (evento.target.value === "nuevo") {
                setAltaRapida(true);
                return;
              }
              setAltaRapida(false);
              setClienteId(Number(evento.target.value) || null);
            }}
          >
            <option value="">— Cliente —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
            <option value="nuevo">+ Nuevo cliente…</option>
          </select>

          {altaRapida && (
            <form className={styles.altaRapida} noValidate onSubmit={crearCliente}>
              <fieldset className={styles.camposCliente} disabled={creandoCliente}>
                <legend className={styles.subtitulo}>Nuevo cliente</legend>
                <label htmlFor={`${prefijo}-nombre`}>Nombre</label>
                <input
                  id={`${prefijo}-nombre`}
                  className={styles.campo}
                  value={datosCliente.nombre}
                  onChange={(evento) => setDatosCliente({ ...datosCliente, nombre: evento.target.value })}
                  autoComplete="name"
                  required
                  aria-invalid={erroresCliente.nombre !== undefined}
                  aria-describedby={erroresCliente.nombre ? `${prefijo}-error-nombre` : undefined}
                />
                {erroresCliente.nombre && (
                  <p id={`${prefijo}-error-nombre`} className={styles.error}>{erroresCliente.nombre}</p>
                )}
                <label htmlFor={`${prefijo}-telefono`}>Teléfono</label>
                <CampoTelefono
                  id={`${prefijo}-telefono`}
                  pais={pais}
                  numero={datosCliente.telefono ?? ""}
                  onCambiarPais={setPais}
                  onCambiarNumero={(numero) => setDatosCliente({ ...datosCliente, telefono: numero })}
                  error={erroresCliente.telefono}
                />
                {erroresCliente.telefono && (
                  <p id={`${prefijo}-telefono-error`} className={styles.error}>{erroresCliente.telefono}</p>
                )}
                <div className={styles.accionesCliente}>
                  <button className={styles.principal} type="submit">
                    {creandoCliente ? "Creando…" : "Crear cliente"}
                  </button>
                  <button
                    className={styles.secundario}
                    type="button"
                    onClick={() => {
                      setAltaRapida(false);
                      setDatosCliente({ nombre: "", telefono: "" });
                      setPais("ES");
                      setErroresCliente({});
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </fieldset>
            </form>
          )}

          <select
            className={styles.campo}
            value={servicioId ?? ""}
            onChange={(e) => setServicioId(Number(e.target.value) || null)}
          >
            <option value="">— Servicio —</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>

          <button
            className={styles.principal}
            disabled={clienteId === null || servicioId === null || altaRapida || creandoCliente}
            onClick={() => {
              if (clienteId === null || servicioId === null) return;
              onCrear(clienteId, servicioId, inicio);
            }}
          >
            Crear cita
          </button>
        </div>
      )}

      {seleccion.tipo === "cita" && citaSeleccionada && (
        <div>
          <p className={styles.titulo}><strong>{citaSeleccionada.cliente_nombre}</strong></p>
          <p>{citaSeleccionada.servicio_nombre}</p>
          <p>{new Date(citaSeleccionada.inicio).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}</p>
          <p>Estado: {citaSeleccionada.estado}</p>

          {citaSeleccionada.estado === "reservada" && (
            <>
              <SelectorFechaHora valor={nuevoInicio} onCambiar={setNuevoInicio} />
              <button className={styles.secundario} onClick={() => onCompletar(citaSeleccionada.id)}>
                Completar cita
              </button>
              <button
                className={styles.principal}
                onClick={() =>
                  onMover(
                    citaSeleccionada.id,
                    nuevoInicio.toISOString()
                  )
                }
              >
                Mover cita
              </button>

              <button className={styles.secundario} onClick={() => onCancelar(citaSeleccionada.id)}>
                Cancelar cita
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Panel;
