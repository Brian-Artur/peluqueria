import { HORA_APERTURA, MINUTOS_FRANJA } from "./constantes";

// getDay(): 0=domingo, 1=lunes... 6=sábado
// columnas del grid: lunes=2 ... sábado=7, domingo=8
export function columnaDeDia(fecha: Date): number {
  const dia = fecha.getDay();
  return dia === 0 ? 8 : dia + 1;
}

// Franjas transcurridas desde la apertura, +2 por la fila de cabecera
export function filaDeHora(fecha: Date): number {
  const minutosDesdeApertura =
    (fecha.getHours() - HORA_APERTURA) * 60 + fecha.getMinutes();
  return minutosDesdeApertura / MINUTOS_FRANJA + 2;
}