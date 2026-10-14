import { z } from "zod";

export const esquemaServicio = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
  categoria_id: z.number().int().positive().nullable(),
  categoria_nombre: z.string().nullable(),
  activo: z.boolean(),
  duracion_min: z.number().int().positive(),
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
  duracion_min: z.number({ error: "La duración debe ser un número" })
    .int("La duración debe ser un número entero")
    .min(5, "La duración mínima es de 5 minutos")
    .max(600, "La duración máxima es de 600 minutos")
    .multipleOf(5, "La duración debe ser múltiplo de 5 minutos"),
  precio: z.string({ error: "El precio debe ser un texto decimal" })
    .trim()
    .regex(/^\d+(?:\.\d{1,2})?$/, "El precio debe ser un decimal mayor o igual que 0, con hasta 2 decimales"),
  activo: z.boolean({ error: "Indica si el servicio está activo" }),
}, { error: "Los datos del servicio deben ser un objeto" });

export type Servicio = z.infer<typeof esquemaServicio>;
export type DatosServicio = z.infer<typeof esquemaDatosServicio>;
