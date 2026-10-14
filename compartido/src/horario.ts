import { z } from "zod";

export const esquemaFechaHorario = z.iso.date({ error: "La fecha debe ser un día válido con formato YYYY-MM-DD" });
const esquemaHora = z.string().regex(
  /^(?:[01]\d|2[0-3]):[0-5][05]$/,
  "La hora debe tener formato HH:MM y ser múltiplo de 5 minutos",
);

export const esquemaTramo = z.object({ abre: esquemaHora, cierra: esquemaHora }).refine(
  (tramo) => tramo.abre < tramo.cierra,
  { message: "La apertura debe ser anterior al cierre", path: ["cierra"] },
);

const esquemaTramos = z.array(esquemaTramo).refine((tramos) => {
  for (let indice = 1; indice < tramos.length; indice++) {
    if (tramos[indice].abre < tramos[indice - 1].cierra) return false;
  }
  return true;
}, "Los tramos deben estar ordenados y no solaparse");

export const esquemaHorarioSemanal = z.array(z.object({
  dia_semana: z.number().int().min(0).max(6),
  tramos: esquemaTramos,
})).max(7).refine((dias) => {
  const numeros = new Set(dias.map((dia) => dia.dia_semana));
  return numeros.size === dias.length;
}, "No se puede repetir un día en el horario semanal");

// El orden del rango se comprueba en el servicio para responder con 409.
export const esquemaDatosTemporada = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(60),
  desde: esquemaFechaHorario,
  hasta: esquemaFechaHorario,
  activa: z.boolean(),
});

export const esquemaTemporada = esquemaDatosTemporada.extend({
  id: z.number().int().positive(),
  horario: esquemaHorarioSemanal,
});

export const esquemaDatosExcepcion = z.object({
  fecha: esquemaFechaHorario,
  cerrado: z.boolean(),
  motivo: z.string().trim().max(200).nullable().transform((valor) => valor === "" ? null : valor),
  tramos: esquemaTramos,
}).refine((datos) => {
  if (datos.cerrado) return datos.tramos.length === 0;
  return datos.tramos.length > 0;
}, { message: "Un día cerrado no tiene tramos; un día abierto necesita al menos uno", path: ["tramos"] });

export const esquemaExcepcion = esquemaDatosExcepcion.safeExtend({ id: z.number().int().positive() });

export const esquemaLocal = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  zona_horaria: z.string().min(1).max(64),
});

export const esquemaHorarioCompleto = z.object({
  general: esquemaHorarioSemanal,
  temporadas: z.array(esquemaTemporada),
  excepciones: z.array(esquemaExcepcion),
});

export const esquemaDiaResuelto = z.object({
  fecha: esquemaFechaHorario,
  tramos: esquemaTramos,
  origen: z.enum(["general", "temporada", "excepcion"]),
  motivo: z.string().nullable(),
  temporada_nombre: z.string().nullable(),
});

export type Tramo = z.infer<typeof esquemaTramo>;
export type HorarioSemanal = z.infer<typeof esquemaHorarioSemanal>;
export type DatosTemporada = z.infer<typeof esquemaDatosTemporada>;
export type Temporada = z.infer<typeof esquemaTemporada>;
export type DatosExcepcion = z.infer<typeof esquemaDatosExcepcion>;
export type Excepcion = z.infer<typeof esquemaExcepcion>;
export type Local = z.infer<typeof esquemaLocal>;
export type HorarioCompleto = z.infer<typeof esquemaHorarioCompleto>;
export type DiaResuelto = z.infer<typeof esquemaDiaResuelto>;
