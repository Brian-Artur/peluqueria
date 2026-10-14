import type { DatosServicio } from "@peluqueria/compartido";
import { insertarServicio } from "../repositories/servicioRepository";
import { validarTipoRecurso } from "./validarTipoRecurso";
import { validarCategoriaServicio } from "./validarCategoriaServicio";

export async function crearServicio(datos: DatosServicio): Promise<number> {
  await validarCategoriaServicio(datos.categoria_id);
  await validarTipoRecurso(datos.tipo_recurso_id);
  return insertarServicio(datos);
}
