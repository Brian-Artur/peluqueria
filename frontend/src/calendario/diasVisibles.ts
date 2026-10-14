import type { Cita } from "../tipos";
import type { DiaResuelto } from "@peluqueria/compartido";
import { fechaDeDia } from "./horario";
import { diasDeLaSemana, mismoDia } from "./fechas";

export function diasVisibles(lunes: Date, citas: Cita[], mostrarCerrados: boolean, horario: DiaResuelto[]): Date[] {
  const dias = diasDeLaSemana(lunes);
  if (mostrarCerrados) {
    return dias;
  }

  return dias.filter((dia) => {
    if (horario.some((resuelto) => resuelto.fecha === fechaDeDia(dia) && resuelto.tramos.length > 0)) {
      return true;
    }

    // Incluso una cita cancelada debe poder consultarse en un día de cierre.
    return citas.some((cita) => mismoDia(new Date(cita.inicio), dia));
  });
}
