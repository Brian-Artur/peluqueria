import { useEffect, useState } from "react";

type Cita = {
  id: number;
  inicio: string;
  fin: string;
  estado: "reservada" | "cancelada" | "completada";
  cliente_id: number;
  cliente_nombre: string;
  servicio_id: number;
  servicio_nombre: string;
};

function App() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/citas")
      .then((res) => res.json())
      .then((data) => setCitas(data))
      .catch(() => setError("No se pudieron cargar las citas"));
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Citas</h1>
      <ul>
        {citas.map((cita) => (
          <li key={cita.id}>
            {cita.inicio} — {cita.cliente_nombre} ({cita.servicio_nombre}) [{cita.estado}]
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;