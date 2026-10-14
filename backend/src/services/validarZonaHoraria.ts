import { ErrorConflicto } from "../errores";

export function validarZonaHoraria(zonaHoraria: string): void {
  if (!Intl.supportedValuesOf("timeZone").includes(zonaHoraria)) {
    throw new ErrorConflicto("La zona horaria no es válida");
  }
}
