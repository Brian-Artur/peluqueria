import type { DatosExcepcion } from "@peluqueria/compartido";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { traducirErrorFechaDuplicada } from "./traducirErrorFechaDuplicada";

export async function bloquearExcepcion(id: number, conexion: Connection): Promise<boolean> {
  const [filas] = await conexion.query<RowDataPacket[]>("SELECT id FROM excepcion_horario WHERE id = ? FOR UPDATE", [id]);
  return filas.length > 0;
}

export async function actualizarExcepcion(id: number, datos: DatosExcepcion, conexion: Connection): Promise<void> {
  try {
    await conexion.query("UPDATE excepcion_horario SET fecha = ?, cerrado = ?, motivo = ? WHERE id = ?",
      [datos.fecha, datos.cerrado, datos.motivo, id]);
    await conexion.query("DELETE FROM excepcion_tramo WHERE excepcion_id = ?", [id]);
    for (const tramo of datos.tramos) {
      await conexion.query("INSERT INTO excepcion_tramo (excepcion_id, abre, cierra) VALUES (?, ?, ?)",
        [id, tramo.abre, tramo.cierra]);
    }
  } catch (error) {
    traducirErrorFechaDuplicada(error);
  }
}
