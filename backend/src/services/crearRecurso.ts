import type { DatosRecurso } from "@peluqueria/compartido";
import { insertarRecurso } from "../repositories/insertarRecurso";
import { validarTipoRecurso } from "./validarTipoRecurso";

export async function crearRecurso(datos: DatosRecurso): Promise<number> {
  await validarTipoRecurso(datos.tipo_recurso_id);
  return insertarRecurso(datos);
}
