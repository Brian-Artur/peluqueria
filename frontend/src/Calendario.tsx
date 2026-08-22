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

  const seleccionarCita = (id: number) => setSeleccion({ tipo: "cita", id });

  const crearCita = async (clienteId: number, servicioId: number, inicio: Date) => {
    await fetch("/api/citas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cliente_id: clienteId,
        servicio_id: servicioId,
        inicio: inicio.toISOString(),
      }),
    });

    const res = await fetch("/api/citas");   // refrescar desde el servidor
    setCitas(await res.json());

    setSeleccion(null);                       // cerrar el panel
  };

  const cancelarCita = async (id: number) => {
    await fetch(`/api/citas/${id}/cancelar`, { method: "POST" });

    const res = await fetch("/api/citas");   // refrescar desde el servidor
    setCitas(await res.json());

    setSeleccion(null);                       // cerrar el panel
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


  const semanaAnterior = () => setLunesVisible(sumarDias(lunesVisible, -7));
  const semanaSiguiente = () => setLunesVisible(sumarDias(lunesVisible, 7));

  const citaSeleccionada =
    seleccion?.tipo === "cita"
      ? citas.find((c) => c.id === seleccion.id) ?? null
      : null;

  const moverCita = async (id: number, inicio: string) => {
    await fetch(`/api/citas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inicio }),
    });

    const res = await fetch("/api/citas");
    setCitas(await res.json());
    setSeleccion(null);
  };

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
          <TarjetaCita key={cita.id} cita={cita} onSeleccionarCita={seleccionarCita} />
        ))}
      </div>

      {seleccion && (
        <Panel
          seleccion={seleccion}
          clientes={clientes}
          servicios={servicios}
          citaSeleccionada={citaSeleccionada}
          onCrear={crearCita}
          onCancelar={cancelarCita}
          onMover={moverCita}
          onCerrar={() => setSeleccion(null)}
        />
      )}
    </>
  );
}

export default Calendario;