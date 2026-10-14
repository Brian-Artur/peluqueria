import type { Competencias } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";
import { bloquearEmpleado } from "../repositories/empleadoRepository";
import { consultarServiciosExistentes, sustituirCompetencias } from "../repositories/competenciaRepository";

export async function reemplazarCompetencias(id: number, competencias: Competencias): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const empleado = await bloquearEmpleado(id, conexion);
    if (!empleado) throw new ErrorNoEncontrado("Empleado no encontrado");
    const ids = competencias.map((competencia) => competencia.servicio_id);
    const existentes = await consultarServiciosExistentes(ids, conexion);
    for (const servicioId of ids) {
      if (!existentes.includes(servicioId)) throw new ErrorConflicto(`El servicio ${servicioId} no existe`);
    }
    await sustituirCompetencias(id, competencias, conexion);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
