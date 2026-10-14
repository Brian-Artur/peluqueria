import { esquemaTiempoEmpleado, type TiempoEmpleado } from "@peluqueria/compartido";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

type TiempoSinCalcular = Omit<TiempoEmpleado, "duracion_agendada">;
interface FilaTiempo extends RowDataPacket, Omit<TiempoSinCalcular, "ultimo_cambio"> {
  usuario_nombre: string | null;
  cambiado_en: Date | null;
}

const esquemaTiempoSinCalcular = esquemaTiempoEmpleado.omit({ duracion_agendada: true });

export async function consultarTiemposEmpleado(empleadoId: number): Promise<TiempoSinCalcular[]> {
  const [filas] = await pool.query<FilaTiempo[]>(
    `SELECT c.servicio_id, s.nombre AS servicio_nombre, cat.nombre AS categoria_nombre,
      s.dificultad, c.nivel, s.duracion_min AS duracion_servicio, s.margen_min AS margen_servicio,
      c.duracion_min AS duracion_propia, c.margen_min AS margen_propio,
      u.nombre AS usuario_nombre, h.cambiado_en
      FROM competencia c JOIN servicio s ON s.id = c.servicio_id
      LEFT JOIN categoria_servicio cat ON cat.id = s.categoria_id
      LEFT JOIN historial_tiempo h ON h.id = (
        SELECT ultimo.id FROM historial_tiempo ultimo
        WHERE ultimo.empleado_id = c.empleado_id AND ultimo.servicio_id = c.servicio_id
        ORDER BY ultimo.cambiado_en DESC, ultimo.id DESC LIMIT 1
      )
      LEFT JOIN usuario u ON u.id = h.usuario_id
      WHERE c.empleado_id = ? AND s.activo = TRUE ORDER BY s.nombre, s.id`,
    [empleadoId]
  );
  return filas.map((fila) => {
    let ultimoCambio: TiempoEmpleado["ultimo_cambio"] = null;
    if (fila.cambiado_en !== null) {
      ultimoCambio = { usuario_nombre: fila.usuario_nombre!, cambiado_en: fila.cambiado_en.toISOString() };
    }
    return esquemaTiempoSinCalcular.parse({ ...fila, ultimo_cambio: ultimoCambio });
  });
}
