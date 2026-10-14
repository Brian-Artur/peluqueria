import type { DatosCategoria } from "@peluqueria/compartido";
import { insertarCategoria } from "../repositories/categoriaRepository";

export async function crearCategoria(datos: DatosCategoria): Promise<number> {
  return insertarCategoria(datos);
}
