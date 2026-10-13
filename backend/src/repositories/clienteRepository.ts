import type { Cliente } from "@peluqueria/compartido";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

interface FilaCliente extends RowDataPacket {
  id: number;
  nombre: string;
  telefono: string | null;
}

function traducirCliente(fila: FilaCliente): Cliente {
  return {
    id: fila.id,
    nombre: fila.nombre,
    telefono: fila.telefono,
  };
}

export async function findAllClientes(): Promise<Cliente[]> {
  const [filas] = await pool.query<FilaCliente[]>(
    "SELECT id, nombre, telefono FROM cliente ORDER BY nombre"
  );
  return filas.map(traducirCliente);
}

export async function findClienteById(id: number): Promise<Cliente | null> {
  const [filas] = await pool.query<FilaCliente[]>(
    "SELECT id, nombre, telefono FROM cliente WHERE id = ?",
    [id]
  );
  const fila = filas[0];
  if (!fila) return null;
  return traducirCliente(fila);
}
