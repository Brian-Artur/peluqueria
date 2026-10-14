import { esquemaExcepcion, type Excepcion, type Tramo } from "@peluqueria/compartido";
import type { Connection, RowDataPacket } from "mysql2/promise";

interface FilaTramo extends RowDataPacket, Tramo { excepcion_id: number }

export async function consultarExcepciones(conexion: Connection): Promise<Excepcion[]> {
  const [filas] = await conexion.query<RowDataPacket[]>(
    "SELECT id, DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, cerrado, motivo FROM excepcion_horario ORDER BY fecha",
  );
  const [tramos] = await conexion.query<FilaTramo[]>(
    `SELECT excepcion_id, TIME_FORMAT(abre, '%H:%i') AS abre, TIME_FORMAT(cierra, '%H:%i') AS cierra
      FROM excepcion_tramo ORDER BY excepcion_id, abre`,
  );
  return filas.map((fila) => {
    const propios = tramos.filter((tramo) => tramo.excepcion_id === fila.id);
    const horario = propios.map((tramo) => ({ abre: tramo.abre, cierra: tramo.cierra }));
    return esquemaExcepcion.parse({ ...fila, cerrado: Boolean(fila.cerrado), tramos: horario });
  });
}
