import { z } from "zod";

// La rejilla del calendario va en franjas de 5 min: un 10:07 caería en una fila a medias
export const inicioEnFranja: z.ZodString = z.string().datetime().refine((valor): boolean => {
  const inicio = new Date(valor);
  return inicio.getUTCMinutes() % 5 === 0 &&
    inicio.getUTCSeconds() === 0 &&
    inicio.getUTCMilliseconds() === 0;
}, { message: "El inicio debe estar en franjas de 5 minutos, con segundos y milisegundos a 0" });
