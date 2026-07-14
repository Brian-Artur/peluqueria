import { useEffect, useState } from "react";
import type { Cita } from "./tipos";
import CabeceraDias from "./calendario/CabeceraDias";
import Rejilla from "./calendario/Rejilla";
import TarjetaCita from "./calendario/TarjetaCita";
import { lunesDeEstaSemana, sumarDias } from "./calendario/fechas";
import "./Calendario.css";

function Calendario() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [lunesVisible, setLunesVisible] = useState(() =>
    lunesDeEstaSemana(new Date())
  );

  useEffect(() => {
    fetch("/api/citas")
      .then((res) => res.json())
      .then(setCitas)
      .catch(() => setCitas([]));
  }, []);

  const semanaAnterior = () => setLunesVisible(sumarDias(lunesVisible, -7));
  const semanaSiguiente = () => setLunesVisible(sumarDias(lunesVisible, 7));

  return (
    <>
      {/* TEMPORAL: se extraerá a ControlesSemana */}
      <div className="controles-semana">
        <button onClick={semanaAnterior}>← Anterior</button>
        <span>{lunesVisible.toLocaleDateString("es-ES")}</span>
        <button onClick={semanaSiguiente}>Siguiente →</button>
      </div>

      <div className="calendario">
        <CabeceraDias />
        <Rejilla />
        {citas.map((cita) => (
          <TarjetaCita key={cita.id} cita={cita} />
        ))}
      </div>
    </>
  );
}

export default Calendario;