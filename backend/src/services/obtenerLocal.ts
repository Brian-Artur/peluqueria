import type { Local } from "@peluqueria/compartido";
import { consultarLocal } from "../repositories/consultarLocal";
import { ErrorNoEncontrado } from "../errores";

export async function obtenerLocal(): Promise<Local> {
  const local = await consultarLocal();
  if (!local) throw new ErrorNoEncontrado("Local no encontrado");
  return local;
}
