import type { DatosRecurso } from "@peluqueria/compartido";
import type { ResultSetHeader } from "mysql2/promise";
import { pool } from "../db";
import { traducirErrorNombreDuplicado } from "./traducirErrorNombreDuplicado";

export async function insertarRecurso(datos: DatosRecurso): Promise<number> {
  try {
    const [resultado] = await pool.query<ResultSetHeader>(
      "INSERT INTO recurso (nombre, tipo_recurso_id, fuera_de_servicio, motivo, activo) VALUES (?, ?, ?, ?, ?)",
      [datos.nombre, datos.tipo_recurso_id, datos.fuera_de_servicio, datos.motivo, datos.activo],
    );
    return resultado.insertId;
  } catch (error) {
    traducirErrorNombreDuplicado(error, "Ya existe un recurso con ese nombre");
  }
}
