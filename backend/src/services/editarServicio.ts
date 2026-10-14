import type { DatosServicio } from "@peluqueria/compartido";
import { actualizarServicio } from "../repositories/servicioRepository";
import { obtenerServicio } from "./obtenerServicio";
import { validarTipoRecurso } from "./validarTipoRecurso";
import { validarCategoriaServicio } from "./validarCategoriaServicio";

export async function editarServicio(id: number, datos: DatosServicio): Promise<void> {
  const servicio = await obtenerServicio(id);
  // Desactivar una categoría conserva sus asociaciones: solo se valida una asignación nueva.
  if (datos.categoria_id !== servicio.categoria_id) await validarCategoriaServicio(datos.categoria_id);
  if (datos.tipo_recurso_id !== servicio.tipo_recurso_id) await validarTipoRecurso(datos.tipo_recurso_id);
  // Solo se actualiza el catálogo: las citas conservan su fin guardado y no se recalculan
  // al cambiar duración o precio. Actualmente las citas no guardan ni cobran un precio.
  await actualizarServicio(id, datos);
}
