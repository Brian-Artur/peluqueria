import { z } from "zod";

const esquemaNombre = z.string({ error: "El nombre debe ser un texto" })
  .trim().min(1, "El nombre es obligatorio")
  .max(60, "El nombre no puede superar los 60 caracteres");

export const esquemaTipoRecurso = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
  activo: z.boolean(),
});

export const esquemaDatosTipoRecurso = z.object({
  nombre: esquemaNombre,
  activo: z.boolean({ error: "Indica si el tipo está activo" }),
}, { error: "Los datos del tipo de recurso deben ser un objeto" });

export const esquemaRecurso = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
  tipo_recurso_id: z.number().int().positive(),
  tipo_recurso_nombre: z.string(),
  fuera_de_servicio: z.boolean(),
  motivo: z.string().nullable(),
  activo: z.boolean(),
});

export const esquemaDatosRecurso = z.object({
  nombre: esquemaNombre,
  tipo_recurso_id: z.number({ error: "El tipo de recurso debe ser un número" })
    .int("El tipo de recurso debe ser un número entero")
    .positive("Elige un tipo de recurso"),
  fuera_de_servicio: z.boolean({ error: "Indica si el recurso está fuera de servicio" }),
  motivo: z.string({ error: "El motivo debe ser un texto o null" })
    .trim().max(200, "El motivo no puede superar los 200 caracteres")
    .nullable().transform((valor) => valor === "" ? null : valor),
  activo: z.boolean({ error: "Indica si el recurso está activo" }),
}, { error: "Los datos del recurso deben ser un objeto" }).refine(
  (datos) => !datos.fuera_de_servicio || datos.motivo !== null,
  { message: "Indica el motivo por el que está fuera de servicio", path: ["motivo"] },
);

export type TipoRecurso = z.infer<typeof esquemaTipoRecurso>;
export type DatosTipoRecurso = z.infer<typeof esquemaDatosTipoRecurso>;
export type Recurso = z.infer<typeof esquemaRecurso>;
export type DatosRecurso = z.infer<typeof esquemaDatosRecurso>;
