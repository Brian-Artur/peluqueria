import type { Baja } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";
import { bloquearEmpleado, cambiarActividadEmpleado } from "../repositories/empleadoRepository";
import { cerrarContrato, consultarContratos } from "../repositories/contratoEmpleadoRepository";
import { contratoVigente } from "./contratoVigente";

export async function darBajaEmpleado(id: number, datos: Baja): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const empleado = await bloquearEmpleado(id, conexion);
    if (!empleado) throw new ErrorNoEncontrado("Empleado no encontrado");
    const contratos = await consultarContratos(id, conexion);
    const vigente = contratoVigente(contratos);
    if (!vigente) throw new ErrorConflicto("El empleado no tiene contrato vigente para darlo de baja");
    if (datos.fecha < vigente.desde) throw new ErrorConflicto("La baja no puede ser anterior al inicio del contrato vigente");
    await cerrarContrato(vigente.id, datos.fecha, conexion);
    await cambiarActividadEmpleado(id, false, conexion);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
