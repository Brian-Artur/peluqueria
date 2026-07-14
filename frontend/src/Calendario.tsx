import { useEffect, useState } from "react";
import type { Cita, Cliente, Servicio, Seleccion } from "./tipos";
import CabeceraDias from "./calendario/CabeceraDias";
import Rejilla from "./calendario/Rejilla";
import TarjetaCita from "./calendario/TarjetaCita";
import { lunesDeEstaSemana, sumarDias } from "./calendario/fechas";
import "./Calendario.css";
import ControlesSemana from "./calendario/ControlesSemana";
import Panel from "./calendario/Panel";


function Calendario() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [lunesVisible, setLunesVisible] = useState(() =>
    lunesDeEstaSemana(new Date())
  );
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  const [seleccion, setSeleccion] = useState<Seleccion | null>(null);

  const seleccionarHueco = (d: number, hora: number) => {
    const inicio = sumarDias(lunesVisible, d); // día correcto, a las 00:00
    inicio.setHours(hora, 0, 0, 0);            // fija la hora, minutos 0
    setSeleccion({ tipo: "hueco", inicio });
  };

  useEffect(() => {
    fetch("/api/citas")
      .then((res) => res.json())
      .then(setCitas)
      .catch(() => setCitas([]));
  }, []);
  useEffect(() => {
    fetch("/api/clientes")
      .then((res) => res.json())
      .then(setClientes)
      .catch(() => setClientes([]));
  }, []);

  useEffect(() => {
    fetch("/api/servicios")
      .then((res) => res.json())
      .then(setServicios)
      .catch(() => setServicios([]));
  }, []);

console.log("clientes", clientes, "servicios", servicios);

  const semanaAnterior = () => setLunesVisible(sumarDias(lunesVisible, -7));
  const semanaSiguiente = () => setLunesVisible(sumarDias(lunesVisible, 7));

  return (
    <>
      <ControlesSemana
        lunesVisible={lunesVisible}
        onAnterior={semanaAnterior}
        onSiguiente={semanaSiguiente}
      />

      <div className="calendario">
        <CabeceraDias />
        <Rejilla onSeleccionarHueco={seleccionarHueco} />
        {citas.map((cita) => (
          <TarjetaCita key={cita.id} cita={cita} />
        ))}
      </div>

      {seleccion && (
        <Panel seleccion={seleccion} onCerrar={() => setSeleccion(null)} />
      )}
    </>
  );
}

export default Calendario;