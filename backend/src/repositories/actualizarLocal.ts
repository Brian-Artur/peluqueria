import type { Local } from "@peluqueria/compartido";
import type { ResultSetHeader } from "mysql2/promise";
import { pool } from "../db";

export async function actualizarLocal(datos: Local): Promise<boolean> {
  const [resultado] = await pool.query<ResultSetHeader>(
    "UPDATE local SET nombre = ?, zona_horaria = ? WHERE id = ?", [datos.nombre, datos.zona_horaria, 1],
  );
  return resultado.affectedRows > 0;
}
