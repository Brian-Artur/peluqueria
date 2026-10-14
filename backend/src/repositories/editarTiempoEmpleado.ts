import { esquemaDatosTiempo, type CambioTiempo, type DatosTiempo } from "@peluqueria/compartido";
import type { Connection, RowDataPacket } from "mysql2/promise";

interface FilaTiempo extends RowDataPacket, DatosTiempo {}

export async function bloquearTiempoEmpleado(
  empleadoId: number, servicioId: number, conexion: Connection
): Promise<DatosTiempo | null> {
  const [filas] = await conexion.query<FilaTiempo[]>(
    "SELECT duracion_min, margen_min FROM competencia WHERE empleado_id = ? AND servicio_id = ? FOR UPDATE",
    [empleadoId, servicioId]
  );
  if (!filas[0]) return null;
  return esquemaDatosTiempo.parse(filas[0]);
}

export async function actualizarTiempoEmpleado(
  empleadoId: number, servicioId: number, datos: DatosTiempo, conexion: Connection
): Promise<void> {
  await conexion.query(
    "UPDATE competencia SET duracion_min = ?, margen_min = ? WHERE empleado_id = ? AND servicio_id = ?",
    [datos.duracion_min, datos.margen_min, empleadoId, servicioId]
  );
}

export async function insertarCambioTiempo(
  empleadoId: number, servicioId: number, usuarioId: number,
  campo: CambioTiempo["campo"], valorAnterior: number | null, valorNuevo: number | null, conexion: Connection
): Promise<void> {
  await conexion.query(
    `INSERT INTO historial_tiempo (empleado_id, servicio_id, campo, valor_anterior, valor_nuevo, usuario_id)
      VALUES (?, ?, ?, ?, ?, ?)`, [empleadoId, servicioId, campo, valorAnterior, valorNuevo, usuarioId]
  );
}
