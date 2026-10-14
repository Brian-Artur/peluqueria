import type { DatosTemporada, Temporada } from "@peluqueria/compartido";
import { ErrorConflicto } from "../errores";

export function validarTemporada(datos: DatosTemporada, temporadas: Temporada[], id?: number): void {
  if (datos.desde > datos.hasta) throw new ErrorConflicto("El inicio de la temporada no puede ser posterior al fin");
  if (!datos.activa) return;
  for (const temporada of temporadas) {
    if (temporada.id === id || !temporada.activa) continue;
    if (datos.desde <= temporada.hasta && temporada.desde <= datos.hasta) {
      throw new ErrorConflicto(`La temporada se solapa con ${temporada.nombre}`);
    }
  }
}
