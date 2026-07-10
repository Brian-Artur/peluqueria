import { useEffect, useState } from "react";
import type { Cita } from "./tipos";
import CabeceraDias from "./calendario/CabeceraDias";
import Rejilla from "./calendario/Rejilla";
import TarjetaCita from "./calendario/TarjetaCita";
import "./Calendario.css";

function Calendario() {
  const [citas, setCitas] = useState<Cita[]>([]);

  useEffect(() => {
    fetch("/api/citas")
      .then((res) => res.json())
      .then(setCitas)
      .catch(() => setCitas([]));
  }, []);

  return (
    <div className="calendario">
      <CabeceraDias />
      <Rejilla />
      {citas.map((cita) => (
        <TarjetaCita key={cita.id} cita={cita} />
      ))}
    </div>
  );
}

export default Calendario;