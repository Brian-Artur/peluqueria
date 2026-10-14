import { z } from "zod";
import { esquemaNivel } from "./empleado";
import { esquemaDatosServicio, esquemaDificultad } from "./servicio";

export const esquemaDatosTiempo = z.object({
  duracion_min: esquemaDatosServicio.shape.duracion_min.nullable(),
  margen_min: esquemaDatosServicio.shape.margen_min,
}, { error: "Los tiempos deben ser un objeto" });

const esquemaUltimoCambio = z.object({
  usuario_nombre: z.string(),
  cambiado_en: z.iso.datetime(),
});

export const esquemaTiempoEmpleado = z.object({
  servicio_id: z.number().int().positive(),
  servicio_nombre: z.string(),
  categoria_nombre: z.string().nullable(),
  dificultad: esquemaDificultad,
  nivel: esquemaNivel,
  duracion_servicio: esquemaDatosServicio.shape.duracion_min,
  margen_servicio: esquemaDatosServicio.shape.margen_min,
  duracion_propia: esquemaDatosTiempo.shape.duracion_min,
  margen_propio: esquemaDatosTiempo.shape.margen_min,
  duracion_agendada: z.number().int().min(5).max(720).multipleOf(5),
  ultimo_cambio: esquemaUltimoCambio.nullable(),
});

export const esquemaCambioTiempo = esquemaUltimoCambio.extend({
  servicio_nombre: z.string(),
  campo: z.enum(["duracion", "margen"]),
  valor_anterior: z.number().int().nullable(),
  valor_nuevo: z.number().int().nullable(),
});

export type DatosTiempo = z.infer<typeof esquemaDatosTiempo>;
export type TiempoEmpleado = z.infer<typeof esquemaTiempoEmpleado>;
export type CambioTiempo = z.infer<typeof esquemaCambioTiempo>;
