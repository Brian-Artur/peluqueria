import type { NuevoContrato } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";
import { bloquearEmpleado, cambiarActividadEmpleado } from "../repositories/empleadoRepository";
import { cerrarContrato, consultarContratos, insertarContrato } from "../repositories/contratoEmpleadoRepository";
import { contratoVigente } from "./contratoVigente";
import { validarTutorContrato } from "./validarTutorContrato";

export async function nuevoContratoEmpleado(id: number, datos: NuevoContrato): Promise<number> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const empleado = await bloquearEmpleado(id, conexion);
    if (!empleado) throw new ErrorNoEncontrado("Empleado no encontrado");
    const contratos = await consultarContratos(id, conexion);
    const vigente = contratoVigente(contratos);
    if (vigente && datos.desde <= vigente.desde) {
      throw new ErrorConflicto("El nuevo contrato debe empezar después del inicio del contrato vigente");
    }
    for (const contrato of contratos) {
      if (contrato.hasta !== null && datos.desde <= contrato.hasta) {
        throw new ErrorConflicto("El nuevo contrato se solapa con el historial del empleado");
      }
    }
    await validarTutorContrato(datos.tutor_id, id, conexion);
    if (vigente) {
      // El cálculo en UTC solo resta un día civil: no depende de cambios de hora en Madrid.
      const diaAnterior = new Date(`${datos.desde}T00:00:00.000Z`);
      diaAnterior.setUTCDate(diaAnterior.getUTCDate() - 1);
      await cerrarContrato(vigente.id, diaAnterior.toISOString().slice(0, 10), conexion);
    }
    const contratoId = await insertarContrato(id, datos, conexion);
    await cambiarActividadEmpleado(id, true, conexion);
    await conexion.commit();
    return contratoId;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
