import { buscarTipoRecurso } from "../repositories/buscarTipoRecurso";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

export async function validarTipoRecurso(tipoId: number | null): Promise<void> {
  if (tipoId === null) return;
  const tipo = await buscarTipoRecurso(tipoId);
  if (!tipo) throw new ErrorNoEncontrado("Tipo de recurso no encontrado");
  if (!tipo.activo) throw new ErrorConflicto("No se puede asignar un tipo de recurso inactivo. Elige un tipo activo.");
}
