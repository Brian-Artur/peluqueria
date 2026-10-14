import type { TipoRecurso } from "@peluqueria/compartido";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

interface Fila extends RowDataPacket {
  id: number;
  nombre: string;
  activo: number;
}

export async function buscarTipoRecurso(id: number): Promise<TipoRecurso | null> {
  const [filas] = await pool.query<Fila[]>(
    "SELECT id, nombre, activo FROM tipo_recurso WHERE id = ?", [id],
  );
  const fila = filas[0];
  if (!fila) return null;
  return { id: fila.id, nombre: fila.nombre, activo: Boolean(fila.activo) };
}
