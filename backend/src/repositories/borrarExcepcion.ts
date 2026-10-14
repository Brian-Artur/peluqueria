import type { ResultSetHeader } from "mysql2/promise";
import { pool } from "../db";

export async function borrarExcepcion(id: number): Promise<boolean> {
  const [resultado] = await pool.query<ResultSetHeader>("DELETE FROM excepcion_horario WHERE id = ?", [id]);
  return resultado.affectedRows > 0;
}
