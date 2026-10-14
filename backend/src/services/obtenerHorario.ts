import type { HorarioCompleto } from "@peluqueria/compartido";
import { pool } from "../db";
import { consultarHorarioGeneral } from "../repositories/consultarHorarioGeneral";
import { consultarTemporadas } from "../repositories/consultarTemporadas";
import { consultarExcepciones } from "../repositories/consultarExcepciones";

export async function obtenerHorario(): Promise<HorarioCompleto> {
  const conexion = await pool.getConnection();
  try {
    // Todas las lecturas comparten snapshot: una sustitución no puede dejar un horario a medias en la respuesta.
    await conexion.beginTransaction();
    const general = await consultarHorarioGeneral(conexion);
    const temporadas = await consultarTemporadas(conexion);
    const excepciones = await consultarExcepciones(conexion);
    await conexion.commit();
    return { general, temporadas, excepciones };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
