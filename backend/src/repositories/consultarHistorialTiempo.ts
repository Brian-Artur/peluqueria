import { esquemaCambioTiempo, type CambioTiempo } from "@peluqueria/compartido";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

interface FilaCambio extends RowDataPacket, Omit<CambioTiempo, "cambiado_en"> {
  cambiado_en: Date;
}

export async function consultarHistorialTiempo(empleadoId: number): Promise<CambioTiempo[]> {
  const [filas] = await pool.query<FilaCambio[]>(
    `SELECT s.nombre AS servicio_nombre, h.campo, h.valor_anterior, h.valor_nuevo,
      u.nombre AS usuario_nombre, h.cambiado_en
      FROM historial_tiempo h JOIN servicio s ON s.id = h.servicio_id
      JOIN usuario u ON u.id = h.usuario_id WHERE h.empleado_id = ?
      ORDER BY h.cambiado_en DESC, h.id DESC LIMIT 50`, [empleadoId]
  );
  return filas.map((fila) => esquemaCambioTiempo.parse({ ...fila, cambiado_en: fila.cambiado_en.toISOString() }));
}
