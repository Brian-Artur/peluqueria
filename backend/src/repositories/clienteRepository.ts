import type { Cliente, DatosCliente } from "@peluqueria/compartido";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db";
import { patronBusqueda, patronBusquedaTelefono } from "./patronBusqueda";

type FilaCliente = RowDataPacket & Cliente;

function traducirCliente(fila: FilaCliente): Cliente {
  return {
    id: fila.id,
    nombre: fila.nombre,
    telefono: fila.telefono,
    email: fila.email,
    notas: fila.notas,
  };
}

export async function findAllClientes(buscar: string = ""): Promise<Cliente[]> {
  if (buscar === "") {
    const [filas] = await pool.query<FilaCliente[]>(
      "SELECT id, nombre, telefono, email, notas FROM cliente ORDER BY nombre"
    );
    return filas.map(traducirCliente);
  }

  const patron = patronBusqueda(buscar);
  const patronTelefono = patronBusquedaTelefono(buscar);
  const [filas] = await pool.query<FilaCliente[]>(
    `SELECT id, nombre, telefono, email, notas FROM cliente
     WHERE LOWER(nombre) LIKE LOWER(?) ESCAPE '!'
        OR LOWER(telefono) LIKE LOWER(?) ESCAPE '!'
        OR LOWER(email) LIKE LOWER(?) ESCAPE '!'
     ORDER BY nombre`,
    [patron, patronTelefono, patron]
  );
  return filas.map(traducirCliente);
}

export async function findClienteById(id: number): Promise<Cliente | null> {
  const [filas] = await pool.query<FilaCliente[]>(
    "SELECT id, nombre, telefono, email, notas FROM cliente WHERE id = ?",
    [id]
  );
  const fila = filas[0];
  if (!fila) return null;
  return traducirCliente(fila);
}

export async function insertarCliente(datos: DatosCliente): Promise<number> {
  const [resultado] = await pool.query<ResultSetHeader>(
    "INSERT INTO cliente (nombre, telefono, email, notas) VALUES (?, ?, ?, ?)",
    [datos.nombre, datos.telefono, datos.email, datos.notas]
  );
  return resultado.insertId;
}

export async function actualizarCliente(id: number, datos: DatosCliente): Promise<void> {
  await pool.query(
    "UPDATE cliente SET nombre = ?, telefono = ?, email = ?, notas = ? WHERE id = ?",
    [datos.nombre, datos.telefono, datos.email, datos.notas, id]
  );
}
