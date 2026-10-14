import type { Local } from "@peluqueria/compartido";
import { actualizarLocal } from "../repositories/actualizarLocal";
import { ErrorNoEncontrado } from "../errores";
import { validarZonaHoraria } from "./validarZonaHoraria";

export async function editarLocal(datos: Local): Promise<void> {
  validarZonaHoraria(datos.zona_horaria);
  if (!await actualizarLocal(datos)) throw new ErrorNoEncontrado("Local no encontrado");
}
