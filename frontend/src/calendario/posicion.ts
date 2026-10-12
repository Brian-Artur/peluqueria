import { HORA_APERTURA, MINUTOS_FRANJA } from "./constantes";
import { mismoDia } from "./fechas";


export function columnaDeFecha(fecha: Date, dias: Date[]): number | null {
  const indice = dias.findIndex((dia) => mismoDia(fecha, dia));
  if (indice === -1) {
    return null;
  }

  return indice + 2;
}

// Franjas transcurridas desde la apertura, +2 por la fila de cabecera
export function filaDeHora(fecha: Date): number {
  const minutosDesdeApertura =
    (fecha.getHours() - HORA_APERTURA) * 60 + fecha.getMinutes();
  return minutosDesdeApertura / MINUTOS_FRANJA + 2;
}
