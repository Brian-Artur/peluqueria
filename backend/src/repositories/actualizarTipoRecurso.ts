import type { DatosTipoRecurso } from "@peluqueria/compartido";
import { pool } from "../db";
import { traducirErrorNombreDuplicado } from "./traducirErrorNombreDuplicado";

export async function actualizarTipoRecurso(id: number, datos: DatosTipoRecurso): Promise<void> {
  try {
    await pool.query(
      "UPDATE tipo_recurso SET nombre = ?, activo = ? WHERE id = ?", [datos.nombre, datos.activo, id],
    );
  } catch (error) {
    traducirErrorNombreDuplicado(error, "Ya existe un tipo de recurso con ese nombre");
  }
}
