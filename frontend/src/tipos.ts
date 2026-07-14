export type Cita = {
  id: number;
  inicio: string;
  fin: string;
  estado: "reservada" | "cancelada" | "completada";
  cliente_id: number;
  cliente_nombre: string;
  servicio_id: number;
  servicio_nombre: string;
};

export type Seleccion =
  | { tipo: "hueco"; inicio: Date }   // click en celda vacía → crear
  | { tipo: "cita"; id: number };     // click en cita existente → ver/editar