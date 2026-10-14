import { z } from "zod";

export const esquemaDificultad = z.enum(["baja", "media", "alta"], {
  error: "La dificultad debe ser baja, media o alta",
});

const esquemaMargen = z.number({ error: "El margen debe ser un número" })
  .int("El margen debe ser un número entero")
  .min(0, "El margen mínimo es de 0 minutos")
  .max(60, "El margen máximo es de 60 minutos")
  .multipleOf(5, "El margen debe ser múltiplo de 5 minutos");

export const esquemaServicio = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
  categoria_id: z.number().int().positive().nullable(),
  categoria_nombre: z.string().nullable(),
  tipo_recurso_id: z.number().int().positive().nullable(),
  tipo_recurso_nombre: z.string().nullable(),
  activo: z.boolean(),
  duracion_min: z.number().int().min(5).max(600).multipleOf(5),
  margen_min: esquemaMargen,
  dificultad: esquemaDificultad,
  // DECIMAL llega como texto; la representación del dinero se decidirá en v7.
  precio: z.string(),
});

export const esquemaDatosServicio = z.object({
  nombre: z.string({ error: "El nombre debe ser un texto" })
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(120, "El nombre no puede superar los 120 caracteres"),
  categoria_id: z.number({ error: "La categoría debe ser un número o null" })
    .int("La categoría debe ser un número entero")
    .positive("La categoría debe ser un id positivo")
    .nullable(),
  tipo_recurso_id: z.number({ error: "El tipo de recurso debe ser un número o null" })
    .int("El tipo de recurso debe ser un número entero")
    .positive("El tipo de recurso debe ser un id positivo")
    .nullable(),
  duracion_min: z.number({ error: "La duración debe ser un número" })
    .int("La duración debe ser un número entero")
    .min(5, "La duración mínima es de 5 minutos")
    .max(600, "La duración máxima es de 600 minutos")
    .multipleOf(5, "La duración debe ser múltiplo de 5 minutos"),
  precio: z.string({ error: "El precio debe ser un texto decimal" })
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, "El precio debe ser un decimal mayor o igual que 0, con hasta 2 decimales"),
  activo: z.boolean({ error: "Indica si el servicio está activo" }),
  margen_min: esquemaMargen,
  dificultad: esquemaDificultad,
}, { error: "Los datos del servicio deben ser un objeto" });

export type Servicio = z.infer<typeof esquemaServicio>;
export type DatosServicio = z.infer<typeof esquemaDatosServicio>;
export type Dificultad = z.infer<typeof esquemaDificultad>;
