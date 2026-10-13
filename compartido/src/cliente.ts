import { z } from "zod";

export const esquemaCliente = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
  telefono: z.string().nullable(),
});

export type Cliente = z.infer<typeof esquemaCliente>;
