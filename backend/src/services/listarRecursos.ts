import type { Recurso } from "@peluqueria/compartido";
import { consultarRecursos } from "../repositories/consultarRecursos";

export async function listarRecursos(incluirInactivos: boolean = false): Promise<Recurso[]> {
  return consultarRecursos(incluirInactivos);
}
