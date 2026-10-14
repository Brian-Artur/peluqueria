import type { DiaResuelto, Excepcion, HorarioSemanal, Temporada } from "@peluqueria/compartido";

export function resolverHorarioDia(
  fecha: string, general: HorarioSemanal, temporadas: Temporada[], excepciones: Excepcion[],
): DiaResuelto {
  const excepcion = excepciones.find((dia) => dia.fecha === fecha);
  if (excepcion) {
    return {
      fecha, tramos: excepcion.cerrado ? [] : excepcion.tramos, origen: "excepcion",
      motivo: excepcion.motivo, temporada_nombre: null,
    };
  }

  const temporada = temporadas.find((actual) => actual.activa && actual.desde <= fecha && fecha <= actual.hasta);
  const horario = temporada ? temporada.horario : general;
  // Una fecha sin hora es un día del salón: UTC aquí solo evita depender de la zona del servidor.
  const diaSemana = new Date(`${fecha}T00:00:00Z`).getUTCDay();
  const dia = horario.find((actual) => actual.dia_semana === diaSemana);
  return {
    fecha, tramos: dia?.tramos ?? [], origen: temporada ? "temporada" : "general",
    motivo: null, temporada_nombre: temporada?.nombre ?? null,
  };
}
