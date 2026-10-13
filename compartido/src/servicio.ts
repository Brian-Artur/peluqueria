import { z } from "zod";

export const esquemaServicio = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
  duracion_min: z.number().int().positive(),
  // DECIMAL llega como texto; la representación del dinero se decidirá en v7.
  precio: z.string(),
});

export type Servicio = z.infer<typeof esquemaServicio>;
