import type { DatosRecurso } from "@peluqueria/compartido";
import { actualizarRecurso } from "../repositories/actualizarRecurso";
import { buscarRecurso } from "../repositories/buscarRecurso";
import { ErrorNoEncontrado } from "../errores";
import { validarTipoRecurso } from "./validarTipoRecurso";

export async function editarRecurso(id: number, datos: DatosRecurso): Promise<void> {
  const recurso = await buscarRecurso(id);
  if (!recurso) throw new ErrorNoEncontrado("Recurso no encontrado");
  // Un tipo desactivado conserva sus asociaciones, pero no admite asignaciones nuevas.
  if (datos.tipo_recurso_id !== recurso.tipo_recurso_id) await validarTipoRecurso(datos.tipo_recurso_id);
  await actualizarRecurso(id, datos);
}
