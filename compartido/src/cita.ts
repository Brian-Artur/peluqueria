import { z } from "zod";
import { inicioEnFranja } from "./inicioEnFranja";

export const esquemaEstadoCita = z.enum(["reservada", "cancelada", "completada"]);

export const esquemaCita = z.object({
  id: z.number().int().positive(),
  inicio: z.string().datetime(),
  fin: z.string().datetime(),
  estado: esquemaEstadoCita,
  cliente_id: z.number().int().positive(),
  cliente_nombre: z.string(),
  servicio_id: z.number().int().positive(),
  servicio_nombre: z.string(),
});

export const esquemaCrearCita = z.object({
  cliente_id: z.number().int().positive(),
  servicio_id: z.number().int().positive(),
  inicio: inicioEnFranja,
});

export const esquemaMoverCita = z.object({
  inicio: inicioEnFranja,
});

export type EstadoCita = z.infer<typeof esquemaEstadoCita>;
export type Cita = z.infer<typeof esquemaCita>;
export type CrearCita = z.infer<typeof esquemaCrearCita>;
export type MoverCita = z.infer<typeof esquemaMoverCita>;
