import type { DatosCategoria } from "@peluqueria/compartido";
import { actualizarCategoria, buscarCategoriaPorId } from "../repositories/categoriaRepository";
import { ErrorNoEncontrado } from "../errores";

export async function editarCategoria(id: number, datos: DatosCategoria): Promise<void> {
  if (!await buscarCategoriaPorId(id)) throw new ErrorNoEncontrado("Categoría no encontrada");
  await actualizarCategoria(id, datos);
}
