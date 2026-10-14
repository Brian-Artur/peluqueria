import type { Connection } from "mysql2/promise";
import { ErrorConflicto } from "../errores";
import { bloquearEmpleado } from "../repositories/empleadoRepository";

export async function validarTutorContrato(tutorId: number | null, empleadoId: number | null, conexion: Connection): Promise<void> {
  if (tutorId === null) return;
  if (tutorId === empleadoId) throw new ErrorConflicto("Un empleado no puede ser su propio tutor");
  const tutor = await bloquearEmpleado(tutorId, conexion);
  if (!tutor || !tutor.activo) throw new ErrorConflicto("El tutor debe ser otro empleado activo");
}
