import { pool } from "../db";

export async function findAllClientes() {
  const [rows] = await pool.query(
    "SELECT id, nombre, telefono FROM cliente ORDER BY nombre"
  );
  return rows;
}