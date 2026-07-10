import { useEffect, useState } from "react";
import Calendario from "./Calendario";

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
  return (
    <div>
      <h1>Agenda</h1>
      <Calendario />
    </div>
  );
}
export default App;