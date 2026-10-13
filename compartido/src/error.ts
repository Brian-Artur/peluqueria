import { z } from "zod";

export const esquemaRespuestaError = z.object({
  error: z.string(),
  detalles: z.unknown().optional(),
});

export type RespuestaError = z.infer<typeof esquemaRespuestaError>;
