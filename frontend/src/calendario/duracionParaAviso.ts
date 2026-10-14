import type { Cita, Servicio } from "@peluqueria/compartido";

export function duracionParaAviso(servicio: Servicio | null, cita: Cita | null): number {
  // Crear y mover usan hoy solo duracion_min en la API, sin sumar los márgenes.
  if (servicio) return servicio.duracion_min;
  if (cita) return (new Date(cita.fin).getTime() - new Date(cita.inicio).getTime()) / 60000;
  return 5;
}
