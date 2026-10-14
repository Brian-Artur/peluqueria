import type { Competencias, Nivel } from "@peluqueria/compartido";

export function cambiarCompetencia(competencias: Competencias, servicioId: number, nivel: Nivel | null): Competencias {
  // PUT reemplaza la lista completa: conservar también las competencias de servicios inactivos.
  const siguientes = competencias.filter((competencia) => competencia.servicio_id !== servicioId);
  if (nivel !== null) siguientes.push({ servicio_id: servicioId, nivel });
  return siguientes;
}
