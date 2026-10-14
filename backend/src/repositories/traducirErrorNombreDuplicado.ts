import { ErrorConflicto } from "../errores";

export function traducirErrorNombreDuplicado(error: unknown, mensaje: string): never {
  // UNIQUE cubre también altas o renombrados simultáneos con el mismo nombre.
  if (typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY") {
    throw new ErrorConflicto(mensaje);
  }
  throw error;
}
