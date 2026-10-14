import { FRANJAS_POR_HORA, MINUTOS_FRANJA } from "./constantes";
import { mismoDia } from "./fechas";


export function columnaDeFecha(fecha: Date, dias: Date[]): number | null {
  const indice = dias.findIndex((dia) => mismoDia(fecha, dia));
  if (indice === -1) {
    return null;
  }

  return indice + 2;
}

// Franjas transcurridas desde la apertura, +2 por la fila de cabecera
export function filaDeHora(fecha: Date, horaInicio: number): number {
  const minutosDesdeApertura =
    (fecha.getHours() - horaInicio) * 60 + fecha.getMinutes();
  return minutosDesdeApertura / MINUTOS_FRANJA + 2;
}

export function filasDeCita(inicio: Date, fin: Date, horaInicio: number, franjas: number): { inicio: number; fin: number } | null {
  const filaInicio = filaDeHora(inicio, horaInicio);
  const duracion = (fin.getTime() - inicio.getTime()) / (MINUTOS_FRANJA * 60000);
  const filaFin = filaInicio + duracion;
  if (filaFin <= 2 || filaInicio >= franjas + 2) return null;
  return { inicio: Math.max(2, Math.floor(filaInicio)), fin: Math.min(franjas + 2, Math.ceil(filaFin)) };
}

export function franjaEnPosicion(desplazamiento: number, alto: number): number {
  const franja = Math.floor(desplazamiento / alto * FRANJAS_POR_HORA);
  return Math.max(0, Math.min(FRANJAS_POR_HORA - 1, franja));
}
