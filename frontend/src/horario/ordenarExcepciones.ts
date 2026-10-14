import type { Excepcion } from "@peluqueria/compartido";

export function separarExcepciones(excepciones: Excepcion[], hoy: string): { proximas: Excepcion[]; pasadas: Excepcion[] } {
  const proximas: Excepcion[] = [];
  const pasadas: Excepcion[] = [];
  for (const excepcion of excepciones) {
    if (excepcion.fecha >= hoy) proximas.push(excepcion);
    else pasadas.push(excepcion);
  }
  proximas.sort((a, b) => a.fecha.localeCompare(b.fecha));
  pasadas.sort((a, b) => b.fecha.localeCompare(a.fecha));
  return { proximas, pasadas };
}
