import type { Contrato } from "@peluqueria/compartido";
import { ErrorConflicto } from "../errores";

export function contratoVigente(contratos: Contrato[]): Contrato | null {
  const vigentes = contratos.filter((contrato) => contrato.hasta === null);
  if (vigentes.length > 1) throw new ErrorConflicto("El empleado tiene más de un contrato vigente; revisa su historial");
  return vigentes[0] ?? null;
}
