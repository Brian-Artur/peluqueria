import { useState } from "react";
import type { Seleccion, Cliente, Servicio } from "../tipos";

type Props = {
  seleccion: Seleccion;
  clientes: Cliente[];
  servicios: Servicio[];
  onCerrar: () => void;
};

function Panel({ seleccion, clientes, servicios, onCerrar }: Props) {
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
        </div>
      )}
    </div>
  );
}

export default Panel;