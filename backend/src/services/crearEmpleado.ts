import type { CrearEmpleado } from "@peluqueria/compartido";
import { pool } from "../db";
import { insertarEmpleado } from "../repositories/empleadoRepository";
import { insertarContrato } from "../repositories/contratoEmpleadoRepository";
import { validarUsuarioEmpleado } from "./validarUsuarioEmpleado";
import { validarTutorContrato } from "./validarTutorContrato";

export async function crearEmpleado(datos: CrearEmpleado): Promise<number> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await validarUsuarioEmpleado(datos.usuario_id, null, conexion);
    const id = await insertarEmpleado(datos, conexion);
    await validarTutorContrato(datos.contrato.tutor_id, id, conexion);
    await insertarContrato(id, datos.contrato, conexion);
    await conexion.commit();
    return id;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
