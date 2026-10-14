import type { DiaResuelto } from "@peluqueria/compartido";
import { obtenerHorario } from "./obtenerHorario";
import { resolverSemana } from "./resolverSemana";

export async function obtenerSemanaHorario(desde: string): Promise<DiaResuelto[]> {
  const horario = await obtenerHorario();
  return resolverSemana(desde, horario.general, horario.temporadas, horario.excepciones);
}
