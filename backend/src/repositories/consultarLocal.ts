import { esquemaLocal, type Local } from "@peluqueria/compartido";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

export async function consultarLocal(): Promise<Local | null> {
  const [filas] = await pool.query<RowDataPacket[]>("SELECT nombre, zona_horaria FROM local WHERE id = ?", [1]);
  if (!filas[0]) return null;
  return esquemaLocal.parse(filas[0]);
}
