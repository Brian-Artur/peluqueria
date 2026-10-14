import type { DiaResuelto, Excepcion, HorarioSemanal, Temporada } from "@peluqueria/compartido";
import { resolverHorarioDia } from "./resolverHorarioDia";

export function resolverSemana(
  desde: string, general: HorarioSemanal, temporadas: Temporada[], excepciones: Excepcion[],
): DiaResuelto[] {
  const fecha = new Date(`${desde}T00:00:00Z`);
  const semana: DiaResuelto[] = [];
  for (let indice = 0; indice < 7; indice++) {
    const dia = fecha.toISOString().slice(0, 10);
    semana.push(resolverHorarioDia(dia, general, temporadas, excepciones));
    fecha.setUTCDate(fecha.getUTCDate() + 1);
  }
  return semana;
}
