import type { HorarioSemanal, Tramo } from "@peluqueria/compartido";

// Los SELECT ya ordenan por día y apertura; agrupamos filas sin exponer el formato de MariaDB.
export function agruparTramosSemanales(filas: (Tramo & { dia_semana: number })[]): HorarioSemanal {
  const horario: HorarioSemanal = [];
  for (const fila of filas) {
    let dia = horario.find((actual) => actual.dia_semana === fila.dia_semana);
    if (!dia) {
      dia = { dia_semana: fila.dia_semana, tramos: [] };
      horario.push(dia);
    }
    dia.tramos.push({ abre: fila.abre, cierra: fila.cierra });
  }
  return horario;
}
