import { useState, type ReactElement } from "react";
import type { Seleccion, Cliente, Servicio, Cita } from "../tipos";
import SelectorFechaHora from "./SelectorFechaHora";
import styles from "./Panel.module.css";

type Props = {
  seleccion: Seleccion;
  clientes: Cliente[];
  servicios: Servicio[];
  citaSeleccionada: Cita | null;
  error: string | null;
  onCrear: (clienteId: number, servicioId: number, inicio: Date) => void;
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
  onCancelar,
  onCompletar,
  onMover,
  onCerrar
}: Props): ReactElement {

  const [clienteId, setClienteId] = useState<number | null>(null);
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [inicio, setInicio] = useState<Date>(() => {
    if (seleccion.tipo === "hueco") return seleccion.inicio;
    return new Date(citaSeleccionada?.inicio ?? Date.now());
  });
  const [nuevoInicio, setNuevoInicio] = useState<Date>(
    () => new Date(citaSeleccionada?.inicio ?? Date.now())
  );

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
            value={clienteId ?? ""}
            onChange={(e) => setClienteId(Number(e.target.value) || null)}
          >
            <option value="">— Cliente —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

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
            disabled={clienteId === null || servicioId === null}
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
