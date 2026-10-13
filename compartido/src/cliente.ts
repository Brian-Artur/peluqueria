import { z } from "zod";

export const esquemaCliente = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
  telefono: z.string().nullable(),
  email: z.string().nullable(),
  notas: z.string().nullable(),
});

export const esquemaDatosCliente = z.object({
  nombre: z.string({ error: "El nombre debe ser un texto" })
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(120, "El nombre no puede superar los 120 caracteres"),
  telefono: z.string({ error: "El teléfono debe ser un texto" })
    .trim()
    .max(20, "El teléfono no puede superar los 20 caracteres")
    .nullable()
    .optional()
    .transform((valor) => valor || null),
  email: z.string({ error: "El email debe ser un texto" })
    .trim()
    .max(254, "El email no puede superar los 254 caracteres")
    .refine((valor) => valor === "" || z.email().safeParse(valor).success, "El email no es válido")
    .nullable()
    .optional()
    .transform((valor) => valor || null),
  notas: z.string({ error: "Las notas deben ser un texto" })
    .trim()
    .max(1000, "Las notas no pueden superar los 1000 caracteres")
    .nullable()
    .optional()
    .transform((valor) => valor || null),
}, { error: "Los datos del cliente deben ser un objeto" });

export type Cliente = z.infer<typeof esquemaCliente>;
export type DatosCliente = z.infer<typeof esquemaDatosCliente>;
