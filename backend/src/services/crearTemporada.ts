import type { DatosTemporada } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorNoEncontrado } from "../errores";
import { bloquearConfiguracionHorario } from "../repositories/bloquearConfiguracionHorario";
import { consultarTemporadas } from "../repositories/consultarTemporadas";
import { insertarTemporada } from "../repositories/insertarTemporada";
import { validarTemporada } from "./validarTemporada";

export async function crearTemporada(datos: DatosTemporada): Promise<number> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    if (!await bloquearConfiguracionHorario(conexion)) throw new ErrorNoEncontrado("Local no encontrado");
    const temporadas = await consultarTemporadas(conexion, true);
    validarTemporada(datos, temporadas);
    const id = await insertarTemporada(datos, conexion);
    await conexion.commit();
    return id;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
