import type { DatosTipoRecurso } from "@peluqueria/compartido";
import { actualizarTipoRecurso } from "../repositories/actualizarTipoRecurso";
import { buscarTipoRecurso } from "../repositories/buscarTipoRecurso";
import { hayRecursosActivosTipo } from "../repositories/hayRecursosActivosTipo";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

export async function editarTipoRecurso(id: number, datos: DatosTipoRecurso): Promise<void> {
  const tipo = await buscarTipoRecurso(id);
  if (!tipo) throw new ErrorNoEncontrado("Tipo de recurso no encontrado");
  if (!datos.activo && await hayRecursosActivosTipo(id)) {
    throw new ErrorConflicto("Primero da de baja o mueve los recursos activos de este tipo antes de desactivarlo.");
  }
  await actualizarTipoRecurso(id, datos);
}
