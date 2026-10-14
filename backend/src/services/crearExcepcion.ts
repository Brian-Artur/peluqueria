import type { DatosExcepcion } from "@peluqueria/compartido";
import { pool } from "../db";
import { insertarExcepcion } from "../repositories/insertarExcepcion";

export async function crearExcepcion(datos: DatosExcepcion): Promise<number> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const id = await insertarExcepcion(datos, conexion);
    await conexion.commit();
    return id;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
