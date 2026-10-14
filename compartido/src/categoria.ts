import { z } from "zod";

export const esquemaCategoria = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
  activa: z.boolean(),
});

export const esquemaDatosCategoria = z.object({
  nombre: z.string({ error: "El nombre debe ser un texto" })
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(60, "El nombre no puede superar los 60 caracteres"),
  activa: z.boolean({ error: "Indica si la categoría está activa" }),
}, { error: "Los datos de la categoría deben ser un objeto" });

export type Categoria = z.infer<typeof esquemaCategoria>;
export type DatosCategoria = z.infer<typeof esquemaDatosCategoria>;
