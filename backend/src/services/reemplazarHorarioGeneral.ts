import type { HorarioSemanal } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorNoEncontrado } from "../errores";
import { bloquearConfiguracionHorario } from "../repositories/bloquearConfiguracionHorario";
import { sustituirHorarioGeneral } from "../repositories/sustituirHorarioGeneral";

export async function reemplazarHorarioGeneral(horario: HorarioSemanal): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    if (!await bloquearConfiguracionHorario(conexion)) throw new ErrorNoEncontrado("Local no encontrado");
    await sustituirHorarioGeneral(horario, conexion);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
