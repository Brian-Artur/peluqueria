import type { DatosExcepcion } from "@peluqueria/compartido";
import type { Connection, ResultSetHeader } from "mysql2/promise";
import { traducirErrorFechaDuplicada } from "./traducirErrorFechaDuplicada";

export async function insertarExcepcion(datos: DatosExcepcion, conexion: Connection): Promise<number> {
  try {
    const [resultado] = await conexion.query<ResultSetHeader>(
      "INSERT INTO excepcion_horario (fecha, cerrado, motivo) VALUES (?, ?, ?)",
      [datos.fecha, datos.cerrado, datos.motivo],
    );
    for (const tramo of datos.tramos) {
      await conexion.query("INSERT INTO excepcion_tramo (excepcion_id, abre, cierra) VALUES (?, ?, ?)",
        [resultado.insertId, tramo.abre, tramo.cierra]);
    }
    return resultado.insertId;
  } catch (error) {
    traducirErrorFechaDuplicada(error);
  }
}
