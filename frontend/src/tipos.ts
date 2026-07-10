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