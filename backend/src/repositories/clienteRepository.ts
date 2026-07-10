import { pool } from "../db";

export async function findAllClientes() {
  const [rows] = await pool.query(
    "SELECT id, nombre, telefono FROM cliente ORDER BY nombre"
  );
  return rows;
}

export async function findClienteById(id: number) {
  const [rows] = await pool.query(
    "SELECT id, nombre, telefono FROM cliente WHERE id = ?",
    [id]
  );
  const clientes = rows as { id: number }[];
  return clientes[0] ?? null;
}