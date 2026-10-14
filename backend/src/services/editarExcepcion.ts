import type { DatosExcepcion } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorNoEncontrado } from "../errores";
import { bloquearExcepcion, actualizarExcepcion } from "../repositories/actualizarExcepcion";

export async function editarExcepcion(id: number, datos: DatosExcepcion): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    if (!await bloquearExcepcion(id, conexion)) throw new ErrorNoEncontrado("Excepción no encontrada");
    await actualizarExcepcion(id, datos, conexion);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
