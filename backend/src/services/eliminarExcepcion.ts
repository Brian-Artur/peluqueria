import { borrarExcepcion } from "../repositories/borrarExcepcion";
import { ErrorNoEncontrado } from "../errores";

export async function eliminarExcepcion(id: number): Promise<void> {
  if (!await borrarExcepcion(id)) throw new ErrorNoEncontrado("Excepción no encontrada");
}
