import { esquemaTemporada, type Temporada, type Tramo } from "@peluqueria/compartido";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { agruparTramosSemanales } from "./agruparTramosSemanales";

interface FilaTramo extends RowDataPacket, Tramo { temporada_id: number; dia_semana: number }

export async function consultarTemporadas(conexion: Connection, bloquear = false): Promise<Temporada[]> {
  const [filas] = await conexion.query<RowDataPacket[]>(
    `SELECT id, nombre, DATE_FORMAT(desde, '%Y-%m-%d') AS desde,
      DATE_FORMAT(hasta, '%Y-%m-%d') AS hasta, activa FROM temporada ORDER BY desde, id${bloquear ? " FOR UPDATE" : ""}`,
  );
  const [tramos] = await conexion.query<FilaTramo[]>(
    `SELECT temporada_id, dia_semana, TIME_FORMAT(abre, '%H:%i') AS abre, TIME_FORMAT(cierra, '%H:%i') AS cierra
      FROM horario_tramo WHERE temporada_id IS NOT NULL ORDER BY temporada_id, dia_semana, abre`,
  );
  return filas.map((fila) => {
    const propios = tramos.filter((tramo) => tramo.temporada_id === fila.id);
    return esquemaTemporada.parse({ ...fila, activa: Boolean(fila.activa), horario: agruparTramosSemanales(propios) });
  });
}
