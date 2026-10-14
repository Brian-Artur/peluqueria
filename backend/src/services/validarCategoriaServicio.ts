import { buscarCategoriaPorId } from "../repositories/categoriaRepository";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

export async function validarCategoriaServicio(categoriaId: number | null): Promise<void> {
  if (categoriaId === null) return;
  const categoria = await buscarCategoriaPorId(categoriaId);
  if (!categoria) throw new ErrorNoEncontrado("Categoría no encontrada");
  if (!categoria.activa) throw new ErrorConflicto("No se puede asignar una categoría inactiva. Elige una categoría activa o Sin categoría.");
}
