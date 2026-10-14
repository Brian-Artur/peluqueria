import type { DatosTipoRecurso } from "@peluqueria/compartido";
import type { ResultSetHeader } from "mysql2/promise";
import { pool } from "../db";
import { traducirErrorNombreDuplicado } from "./traducirErrorNombreDuplicado";

export async function insertarTipoRecurso(datos: DatosTipoRecurso): Promise<number> {
  try {
    const [resultado] = await pool.query<ResultSetHeader>(
      "INSERT INTO tipo_recurso (nombre, activo) VALUES (?, ?)", [datos.nombre, datos.activo],
    );
    return resultado.insertId;
  } catch (error) {
    traducirErrorNombreDuplicado(error, "Ya existe un tipo de recurso con ese nombre");
  }
}
