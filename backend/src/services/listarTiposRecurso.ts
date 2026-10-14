import type { TipoRecurso } from "@peluqueria/compartido";
import { consultarTiposRecurso } from "../repositories/consultarTiposRecurso";

export async function listarTiposRecurso(incluirInactivos: boolean = false): Promise<TipoRecurso[]> {
  return consultarTiposRecurso(incluirInactivos);
}
