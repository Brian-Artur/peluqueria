import type { HorarioSemanal, Tramo } from "@peluqueria/compartido";

export const DIAS_SEMANA = [
  { numero: 1, nombre: "Lunes" }, { numero: 2, nombre: "Martes" },
  { numero: 3, nombre: "Miércoles" }, { numero: 4, nombre: "Jueves" },
  { numero: 5, nombre: "Viernes" }, { numero: 6, nombre: "Sábado" },
  { numero: 0, nombre: "Domingo" },
];

export function cambiarTramosDeDia(semana: HorarioSemanal, numero: number, tramos: Tramo[]): HorarioSemanal {
  return DIAS_SEMANA.map((dia) => {
    if (dia.numero === numero) return { dia_semana: numero, tramos };
    return { dia_semana: dia.numero, tramos: semana.find((elemento) => elemento.dia_semana === dia.numero)?.tramos ?? [] };
  });
}

export function horasDeCincoMinutos(): string[] {
  return Array.from({ length: 24 * 12 }, (_, indice) => {
    const hora = String(Math.floor(indice / 12)).padStart(2, "0");
    const minuto = String(indice % 12 * 5).padStart(2, "0");
    return `${hora}:${minuto}`;
  });
}

export function añadirTramo(tramos: Tramo[]): Tramo[] {
  const ultimo = tramos.at(-1);
  if (!ultimo) return [{ abre: "09:00", cierra: "14:00" }];
  const [hora, minuto] = ultimo.cierra.split(":").map(Number);
  const cierreMinutos = Math.min(hora * 60 + minuto + 60, 1435);
  const cierra = `${String(Math.floor(cierreMinutos / 60)).padStart(2, "0")}:${String(cierreMinutos % 60).padStart(2, "0")}`;
  return [...tramos, { abre: ultimo.cierra, cierra }];
}
