import type { DatosEmpleado } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorNoEncontrado } from "../errores";
import { actualizarEmpleado, bloquearEmpleado } from "../repositories/empleadoRepository";
import { validarUsuarioEmpleado } from "./validarUsuarioEmpleado";

export async function editarEmpleado(id: number, datos: DatosEmpleado): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const empleado = await bloquearEmpleado(id, conexion);
    if (!empleado) throw new ErrorNoEncontrado("Empleado no encontrado");
    await validarUsuarioEmpleado(datos.usuario_id, id, conexion);
    const usuarioId = datos.usuario_id === undefined ? empleado.usuario_id : datos.usuario_id;
    await actualizarEmpleado(id, { ...datos, usuario_id: usuarioId }, conexion);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
