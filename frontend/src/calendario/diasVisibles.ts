import type { Cita } from "../tipos";
import { DIAS_APERTURA } from "./constantes";
import { diasDeLaSemana, mismoDia } from "./fechas";

export function diasVisibles(lunes: Date, citas: Cita[], mostrarCerrados: boolean): Date[] {
  const dias = diasDeLaSemana(lunes);
  if (mostrarCerrados) {
    return dias;
  }

  return dias.filter((dia) => {
    if (DIAS_APERTURA.includes(dia.getDay())) {
      return true;
    }

    // Incluso una cita cancelada debe poder consultarse en un día de cierre.
    return citas.some((cita) => mismoDia(new Date(cita.inicio), dia));
  });
}
