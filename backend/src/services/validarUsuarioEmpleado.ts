import type { Connection } from "mysql2/promise";
import { ErrorConflicto } from "../errores";
import { buscarUsuarioPorId } from "../repositories/usuarioRepository";
import { buscarEmpleadoPorUsuario } from "../repositories/empleadoRepository";

export async function validarUsuarioEmpleado(usuarioId: number | null | undefined, empleadoId: number | null, conexion: Connection): Promise<void> {
  if (usuarioId == null) return;
  const usuario = await buscarUsuarioPorId(usuarioId, conexion);
  if (!usuario) throw new ErrorConflicto("El usuario indicado no existe");
  const enlazado = await buscarEmpleadoPorUsuario(usuarioId, conexion);
  if (enlazado !== null && enlazado !== empleadoId) {
    throw new ErrorConflicto("Ese usuario ya está enlazado a otro empleado");
  }
}
