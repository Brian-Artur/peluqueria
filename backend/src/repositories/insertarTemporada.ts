import type { DatosTemporada } from "@peluqueria/compartido";
import type { Connection, ResultSetHeader } from "mysql2/promise";

export async function insertarTemporada(datos: DatosTemporada, conexion: Connection): Promise<number> {
  const [resultado] = await conexion.query<ResultSetHeader>(
    "INSERT INTO temporada (nombre, desde, hasta, activa) VALUES (?, ?, ?, ?)",
    [datos.nombre, datos.desde, datos.hasta, datos.activa],
  );
  return resultado.insertId;
}
