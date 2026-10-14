import type { TiempoEmpleado } from "@peluqueria/compartido";
import { ErrorNoEncontrado } from "../errores";
import { buscarEmpleadoPorId } from "../repositories/empleadoRepository";
import { consultarTiemposEmpleado } from "../repositories/consultarTiemposEmpleado";
import { calcularDuracionAgendada } from "./calcularDuracionAgendada";

export async function listarTiemposEmpleado(empleadoId: number): Promise<TiempoEmpleado[]> {
  const empleado = await buscarEmpleadoPorId(empleadoId);
  if (!empleado) throw new ErrorNoEncontrado("Empleado no encontrado");
  const tiempos = await consultarTiemposEmpleado(empleadoId);
  return tiempos.map((tiempo) => ({
    ...tiempo,
    duracion_agendada: calcularDuracionAgendada(
      tiempo.duracion_servicio, tiempo.duracion_propia, tiempo.margen_servicio, tiempo.margen_propio
    ),
  }));
}
