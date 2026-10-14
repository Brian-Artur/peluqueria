import type { Categoria } from "@peluqueria/compartido";
import { consultarCategorias } from "../repositories/categoriaRepository";

export async function listarCategorias(): Promise<Categoria[]> {
  return consultarCategorias();
}
