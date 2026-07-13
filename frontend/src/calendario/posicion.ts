import { HORA_APERTURA, MINUTOS_FRANJA } from "./constantes";


export function columnaDeDia(fecha: Date): number {
  const dia = fecha.getDay();       // mundo JS: 0=Dom, 1= Lun...
  return dia === 0 ? 8 : dia + 1;   // mundo grid columna 2...8
}

// Franjas transcurridas desde la apertura, +2 por la fila de cabecera
export function filaDeHora(fecha: Date): number {
  const minutosDesdeApertura =
    (fecha.getHours() - HORA_APERTURA) * 60 + fecha.getMinutes();
  return minutosDesdeApertura / MINUTOS_FRANJA + 2;
}