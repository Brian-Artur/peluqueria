import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

export async function hayRecursosActivosTipo(tipoId: number): Promise<boolean> {
  const [filas] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM recurso WHERE tipo_recurso_id = ? AND activo = TRUE LIMIT 1", [tipoId],
  );
  return filas.length > 0;
}
