import { useState } from "react";
import type { Seleccion, Cliente, Servicio, Cita } from "../tipos";

type Props = {
  seleccion: Seleccion;
  clientes: Cliente[];
  servicios: Servicio[];
  citaSeleccionada: Cita | null;
  onCrear: (clienteId: number, servicioId: number, inicio: Date) => void;
  onCerrar: () => void;
};

function Panel({ seleccion, clientes, servicios, onCrear, onCerrar }: Props) {
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [servicioId, setServicioId] = useState<number | null>(null);

  return (
    <div className="panel">
      <button onClick={onCerrar}>Cerrar</button>

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
    </div>
  );
}

export default Panel;