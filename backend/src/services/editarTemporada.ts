import type { DatosTemporada } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorNoEncontrado } from "../errores";
import { bloquearConfiguracionHorario } from "../repositories/bloquearConfiguracionHorario";
import { consultarTemporadas } from "../repositories/consultarTemporadas";
import { actualizarTemporada } from "../repositories/actualizarTemporada";
import { validarTemporada } from "./validarTemporada";

export async function editarTemporada(id: number, datos: DatosTemporada): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    if (!await bloquearConfiguracionHorario(conexion)) throw new ErrorNoEncontrado("Local no encontrado");
    const temporadas = await consultarTemporadas(conexion, true);
    if (!temporadas.some((temporada) => temporada.id === id)) throw new ErrorNoEncontrado("Temporada no encontrada");
    validarTemporada(datos, temporadas, id);
    await actualizarTemporada(id, datos, conexion);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
