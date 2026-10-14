import type { Recurso } from "@peluqueria/compartido";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

interface Fila extends RowDataPacket {
  id: number;
  nombre: string;
  activo: number;
  tipo_recurso_id: number;
  tipo_recurso_nombre: string;
  fuera_de_servicio: number;
  motivo: string | null;
}

export async function buscarRecurso(id: number): Promise<Recurso | null> {
  const [filas] = await pool.query<Fila[]>(
    `SELECT r.id, r.nombre, r.tipo_recurso_id, t.nombre AS tipo_recurso_nombre,
      r.fuera_de_servicio, r.motivo, r.activo
      FROM recurso r JOIN tipo_recurso t ON t.id = r.tipo_recurso_id
      WHERE r.id = ?`, [id],
  );
  const fila = filas[0];
  if (!fila) return null;
  return {
    id: fila.id,
    nombre: fila.nombre,
    tipo_recurso_id: fila.tipo_recurso_id,
    tipo_recurso_nombre: fila.tipo_recurso_nombre,
    fuera_de_servicio: Boolean(fila.fuera_de_servicio),
    motivo: fila.motivo,
    activo: Boolean(fila.activo),
  };
}
