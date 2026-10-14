import type { Categoria, DatosCategoria } from "@peluqueria/compartido";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db";
import { ErrorConflicto } from "../errores";

interface FilaCategoria extends RowDataPacket {
  id: number;
  nombre: string;
  activa: number;
}

function traducirCategoria(fila: FilaCategoria): Categoria {
  return { id: fila.id, nombre: fila.nombre, activa: Boolean(fila.activa) };
}

function traducirErrorDuplicado(error: unknown): never {
  // UNIQUE cubre también altas o renombrados simultáneos con el mismo nombre.
  if (typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY") {
    throw new ErrorConflicto("Ya existe una categoría con ese nombre");
  }
  throw error;
}

export async function consultarCategorias(): Promise<Categoria[]> {
  const [filas] = await pool.query<FilaCategoria[]>(
    "SELECT id, nombre, activa FROM categoria_servicio ORDER BY nombre, id"
  );
  return filas.map(traducirCategoria);
}

export async function buscarCategoriaPorId(id: number): Promise<Categoria | null> {
  const [filas] = await pool.query<FilaCategoria[]>(
    "SELECT id, nombre, activa FROM categoria_servicio WHERE id = ?", [id]
  );
  const fila = filas[0];
  if (!fila) return null;
  return traducirCategoria(fila);
}

export async function insertarCategoria(datos: DatosCategoria): Promise<number> {
  try {
    const [resultado] = await pool.query<ResultSetHeader>(
      "INSERT INTO categoria_servicio (nombre, activa) VALUES (?, ?)", [datos.nombre, datos.activa]
    );
    return resultado.insertId;
  } catch (error) {
    traducirErrorDuplicado(error);
  }
}

export async function actualizarCategoria(id: number, datos: DatosCategoria): Promise<void> {
  try {
    await pool.query(
      "UPDATE categoria_servicio SET nombre = ?, activa = ? WHERE id = ?", [datos.nombre, datos.activa, id]
    );
  } catch (error) {
    traducirErrorDuplicado(error);
  }
}
