import type { Empleado } from "@peluqueria/compartido";
import { ErrorNoEncontrado } from "../errores";
import { buscarEmpleadoPorId } from "../repositories/empleadoRepository";
import { consultarContratos } from "../repositories/contratoEmpleadoRepository";
import { consultarCompetenciasEmpleado } from "../repositories/competenciaRepository";

export async function obtenerEmpleado(id: number): Promise<Empleado> {
  const empleado = await buscarEmpleadoPorId(id);
  if (!empleado) throw new ErrorNoEncontrado("Empleado no encontrado");
  const contratos = await consultarContratos(id);
  const competencias = await consultarCompetenciasEmpleado(id);
  return { ...empleado, contratos, competencias };
}
