import type { DatosTiempo } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorNoEncontrado } from "../errores";
import { bloquearEmpleado } from "../repositories/empleadoRepository";
import { actualizarTiempoEmpleado, bloquearTiempoEmpleado, insertarCambioTiempo } from "../repositories/editarTiempoEmpleado";

export async function editarTiempoEmpleado(
  empleadoId: number, servicioId: number, datos: DatosTiempo, usuarioId: number
): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    // Usa el mismo bloqueo que reemplazarCompetencias para que ambos cambios no se pisen.
    const empleado = await bloquearEmpleado(empleadoId, conexion);
    if (!empleado) throw new ErrorNoEncontrado("Empleado no encontrado");
    const anterior = await bloquearTiempoEmpleado(empleadoId, servicioId, conexion);
    if (!anterior) throw new ErrorNoEncontrado("Competencia no encontrada");
    const cambiaDuracion = anterior.duracion_min !== datos.duracion_min;
    const cambiaMargen = anterior.margen_min !== datos.margen_min;
    if (cambiaDuracion || cambiaMargen) {
      await actualizarTiempoEmpleado(empleadoId, servicioId, datos, conexion);
    }
    if (cambiaDuracion) {
      await insertarCambioTiempo(empleadoId, servicioId, usuarioId, "duracion", anterior.duracion_min, datos.duracion_min, conexion);
    }
    if (cambiaMargen) {
      await insertarCambioTiempo(empleadoId, servicioId, usuarioId, "margen", anterior.margen_min, datos.margen_min, conexion);
    }
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
