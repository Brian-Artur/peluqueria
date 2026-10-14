import type { DatosTemporada } from "@peluqueria/compartido";
import type { Connection } from "mysql2/promise";

export async function actualizarTemporada(id: number, datos: DatosTemporada, conexion: Connection): Promise<void> {
  await conexion.query(
    "UPDATE temporada SET nombre = ?, desde = ?, hasta = ?, activa = ? WHERE id = ?",
    [datos.nombre, datos.desde, datos.hasta, datos.activa, id],
  );
}
