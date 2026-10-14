import type { TipoRecurso } from "@peluqueria/compartido";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

interface Fila extends RowDataPacket {
  id: number;
  nombre: string;
  activo: number;
}

export async function consultarTiposRecurso(incluirInactivos: boolean): Promise<TipoRecurso[]> {
  const [filas] = await pool.query<Fila[]>(
    "SELECT id, nombre, activo FROM tipo_recurso WHERE (? = TRUE OR activo = TRUE) ORDER BY nombre, id",
    [incluirInactivos],
  );
  return filas.map((fila) => ({ id: fila.id, nombre: fila.nombre, activo: Boolean(fila.activo) }));
}
