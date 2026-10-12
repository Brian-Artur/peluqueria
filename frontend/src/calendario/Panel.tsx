import { useState, type ReactElement } from "react";
import type { Seleccion, Cliente, Servicio, Cita } from "../tipos";
import { fechaParaInput } from "./fechas";
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
  const [nuevoInicio, setNuevoInicio] = useState("");

  return (
    <div>
      <button onClick={onCerrar}>Cerrar</button>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}

      {seleccion.tipo === "hueco" && (
        <div>
          <p>Nueva cita: {seleccion.inicio.toLocaleString("es-ES")}</p>

          <select
            value={clienteId ?? ""}
            onChange={(e) => setClienteId(Number(e.target.value) || null)}
          >
            <option value="">— Cliente —</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          <select
            value={servicioId ?? ""}
            onChange={(e) => setServicioId(Number(e.target.value) || null)}
          >
            <option value="">— Servicio —</option>
            {servicios.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>

          <button
            disabled={clienteId === null || servicioId === null}
            onClick={() => {
              if (clienteId === null || servicioId === null) return;
              onCrear(clienteId, servicioId, seleccion.inicio);
            }}
          >
            Crear cita
          </button>
        </div>
      )}

      {seleccion.tipo === "cita" && citaSeleccionada && (
        <div>
          <p><strong>{citaSeleccionada.cliente_nombre}</strong></p>
          <p>{citaSeleccionada.servicio_nombre}</p>
          <p>{new Date(citaSeleccionada.inicio).toLocaleString("es-ES")}</p>
          <p>Estado: {citaSeleccionada.estado}</p>

          {citaSeleccionada.estado === "reservada" && (
            <>
              <input
                type="datetime-local"
                step={300}
                value={nuevoInicio || fechaParaInput(citaSeleccionada.inicio)}
                onChange={(e) => setNuevoInicio(e.target.value)}
              />
              <button onClick={() => onCompletar(citaSeleccionada.id)}>
                Completar cita
              </button>
              <button
                onClick={() =>
                  onMover(
                    citaSeleccionada.id,
                    new Date(nuevoInicio || fechaParaInput(citaSeleccionada.inicio))
                      .toISOString()
                  )
                }
              >
                Mover cita
              </button>

              <button onClick={() => onCancelar(citaSeleccionada.id)}>
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
