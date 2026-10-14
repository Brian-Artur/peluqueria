import { ErrorConflicto } from "../errores";

export function traducirErrorFechaDuplicada(error: unknown): never {
  // UNIQUE cubre también dos altas o cambios simultáneos para la misma fecha.
  if (typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY") {
    throw new ErrorConflicto("Ya existe una excepción para esa fecha");
  }
  throw error;
}
