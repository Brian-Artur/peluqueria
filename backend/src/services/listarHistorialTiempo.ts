import type { CambioTiempo } from "@peluqueria/compartido";
import { ErrorNoEncontrado } from "../errores";
import { buscarEmpleadoPorId } from "../repositories/empleadoRepository";
import { consultarHistorialTiempo } from "../repositories/consultarHistorialTiempo";

export async function listarHistorialTiempo(empleadoId: number): Promise<CambioTiempo[]> {
  const empleado = await buscarEmpleadoPorId(empleadoId);
  if (!empleado) throw new ErrorNoEncontrado("Empleado no encontrado");
  return consultarHistorialTiempo(empleadoId);
}
