import type { DatosTipoRecurso } from "@peluqueria/compartido";
import { insertarTipoRecurso } from "../repositories/insertarTipoRecurso";

export async function crearTipoRecurso(datos: DatosTipoRecurso): Promise<number> {
  return insertarTipoRecurso(datos);
}
