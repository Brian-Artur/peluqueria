import type { DiaResuelto, Tramo } from "@peluqueria/compartido";
import { MINUTOS_FRANJA } from "./constantes";

export type RangoRejilla = { horaInicio: number; horaFin: number; franjas: number };

export function fechaDeDia(fecha: Date): string {
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

function minutosDeHora(hora: string): number {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

export function rangoDeHorario(dias: DiaResuelto[]): RangoRejilla {
  let apertura = Infinity;
  let cierre = -Infinity;
  for (const dia of dias) {
    for (const tramo of dia.tramos) {
      apertura = Math.min(apertura, minutosDeHora(tramo.abre));
      cierre = Math.max(cierre, minutosDeHora(tramo.cierra));
    }
  }
  const horaInicio = Number.isFinite(apertura) ? Math.floor(apertura / 60) : 9;
  const horaFin = Number.isFinite(cierre) ? Math.ceil(cierre / 60) : 20;
  return { horaInicio, horaFin, franjas: (horaFin - horaInicio) * 60 / MINUTOS_FRANJA };
}

export function intervaloEnTramos(minutoInicio: number, duracion: number, tramos: Tramo[]): boolean {
  if (duracion <= 0 || minutoInicio < 0 || minutoInicio + duracion > 1440) return false;
  // Los tramos contiguos también permiten una cita que cruza su límite común.
  let cubiertoHasta = minutoInicio;
  for (const tramo of tramos) {
    const abre = minutosDeHora(tramo.abre);
    const cierra = minutosDeHora(tramo.cierra);
    if (cierra <= cubiertoHasta) continue;
    if (abre > cubiertoHasta) return false;
    cubiertoHasta = cierra;
    if (cubiertoHasta >= minutoInicio + duracion) return true;
  }
  return false;
}

export function citaDentroDeHorario(inicio: Date, duracion: number, dias: DiaResuelto[]): boolean {
  const dia = dias.find((elemento) => elemento.fecha === fechaDeDia(inicio));
  if (!dia || !Number.isFinite(inicio.getTime())) return false;
  const minutoInicio = inicio.getHours() * 60 + inicio.getMinutes()
    + inicio.getSeconds() / 60 + inicio.getMilliseconds() / 60000;
  return intervaloEnTramos(minutoInicio, duracion, dia.tramos);
}
