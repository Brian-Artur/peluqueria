import type { DatosServicio } from "@peluqueria/compartido";
import { insertarServicio } from "../repositories/servicioRepository";
import { validarCategoriaServicio } from "./validarCategoriaServicio";

export async function crearServicio(datos: DatosServicio): Promise<number> {
  await validarCategoriaServicio(datos.categoria_id);
  return insertarServicio(datos);
}
