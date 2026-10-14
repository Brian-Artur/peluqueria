import type { HorarioSemanal } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorNoEncontrado } from "../errores";
import { bloquearConfiguracionHorario } from "../repositories/bloquearConfiguracionHorario";
import { consultarTemporadas } from "../repositories/consultarTemporadas";
import { sustituirHorarioTemporada } from "../repositories/sustituirHorarioTemporada";

export async function reemplazarHorarioTemporada(id: number, horario: HorarioSemanal): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    if (!await bloquearConfiguracionHorario(conexion)) throw new ErrorNoEncontrado("Local no encontrado");
    const temporadas = await consultarTemporadas(conexion, true);
    if (!temporadas.some((temporada) => temporada.id === id)) throw new ErrorNoEncontrado("Temporada no encontrada");
    await sustituirHorarioTemporada(id, horario, conexion);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
