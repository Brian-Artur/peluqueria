import { pool } from "../db";

export async function findAllServicios() {
  const [rows] = await pool.query(
    "SELECT id, nombre, duracion_min, precio FROM servicio ORDER BY nombre"
  );
  return rows;
}