export type { Cita, Cliente, Servicio } from "@peluqueria/compartido";

export type Seleccion =
  | { tipo: "hueco"; inicio: Date }   // click en celda vacía → crear
  | { tipo: "cita"; id: number };     // click en cita existente → ver/editar
