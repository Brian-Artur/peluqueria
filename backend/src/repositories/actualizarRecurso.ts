import type { DatosRecurso } from "@peluqueria/compartido";
import { pool } from "../db";
import { traducirErrorNombreDuplicado } from "./traducirErrorNombreDuplicado";

export async function actualizarRecurso(id: number, datos: DatosRecurso): Promise<void> {
  try {
    await pool.query(
      "UPDATE recurso SET nombre = ?, tipo_recurso_id = ?, fuera_de_servicio = ?, motivo = ?, activo = ? WHERE id = ?",
      [datos.nombre, datos.tipo_recurso_id, datos.fuera_de_servicio, datos.motivo, datos.activo, id],
    );
  } catch (error) {
    traducirErrorNombreDuplicado(error, "Ya existe un recurso con ese nombre");
  }
}
