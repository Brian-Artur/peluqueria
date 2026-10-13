import type { z } from "zod";
import type { esquemaDatosCliente } from "@peluqueria/compartido";

export type FormularioCliente = z.input<typeof esquemaDatosCliente>;
export type ErroresCliente = Partial<Record<keyof FormularioCliente, string>>;

export function erroresDeCliente(issues: readonly z.core.$ZodIssue[]): ErroresCliente {
  const errores: ErroresCliente = {};
  for (const issue of issues) {
    const campo = issue.path[0];
    if (campo !== "nombre" && campo !== "telefono" && campo !== "email" && campo !== "notas") {
      continue;
    }
    // El primer mensaje por campo suele ser el más útil para corregirlo.
    if (errores[campo] === undefined) errores[campo] = issue.message;
  }
  return errores;
}
