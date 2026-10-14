import { esquemaHorarioSemanal, type HorarioSemanal, type Tramo } from "@peluqueria/compartido";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { agruparTramosSemanales } from "./agruparTramosSemanales";

interface FilaTramo extends RowDataPacket, Tramo { dia_semana: number }

export async function consultarHorarioGeneral(conexion: Connection): Promise<HorarioSemanal> {
  const [filas] = await conexion.query<FilaTramo[]>(
    `SELECT dia_semana, TIME_FORMAT(abre, '%H:%i') AS abre, TIME_FORMAT(cierra, '%H:%i') AS cierra
      FROM horario_tramo WHERE temporada_id IS NULL ORDER BY dia_semana, abre`,
  );
  return esquemaHorarioSemanal.parse(agruparTramosSemanales(filas));
}
