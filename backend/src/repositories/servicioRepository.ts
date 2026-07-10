import { pool } from "../db";

export async function findAllServicios() {
  const [rows] = await pool.query(
    "SELECT id, nombre, duracion_min, precio FROM servicio ORDER BY nombre"
  );
  return rows;
}

export async function findServicioById(id: number) {
  const [rows] = await pool.query(
    "SELECT id, nombre, duracion_min, precio FROM servicio WHERE id = ?",
    [id]
  );
  const servicios = rows as { id: number; duracion_min: number }[];
  return servicios[0] ?? null;
}