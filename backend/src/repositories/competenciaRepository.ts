import {
  esquemaCompetencia, esquemaCompetenciaResumen, type Competencia, type CompetenciaResumen, type Competencias,
} from "@peluqueria/compartido";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

interface FilaCompetencia extends RowDataPacket, CompetenciaResumen {}
interface FilaServicio extends RowDataPacket { id: number }

export async function consultarCompetenciasEmpleado(empleadoId: number): Promise<Competencia[]> {
  const [filas] = await pool.query<FilaCompetencia[]>(
    "SELECT servicio_id, nivel FROM competencia WHERE empleado_id = ? ORDER BY servicio_id", [empleadoId]
  );
  return filas.map((fila) => esquemaCompetencia.parse(fila));
}

export async function consultarCompetenciasActivas(): Promise<CompetenciaResumen[]> {
  const [filas] = await pool.query<FilaCompetencia[]>(
    `SELECT c.empleado_id, c.servicio_id, c.nivel FROM competencia c
      JOIN empleado e ON e.id = c.empleado_id WHERE e.activo = TRUE
      ORDER BY c.empleado_id, c.servicio_id`
  );
  return filas.map((fila) => esquemaCompetenciaResumen.parse(fila));
}

export async function consultarServiciosExistentes(ids: number[], conexion: Connection): Promise<number[]> {
  if (ids.length === 0) return [];
  const marcadores = ids.map(() => "?").join(", ");
  const [filas] = await conexion.query<FilaServicio[]>(
    `SELECT id FROM servicio WHERE id IN (${marcadores}) ORDER BY id LOCK IN SHARE MODE`, ids
  );
  return filas.map((fila) => fila.id);
}

export async function sustituirCompetencias(empleadoId: number, competencias: Competencias, conexion: Connection): Promise<void> {
  if (competencias.length === 0) {
    await conexion.query("DELETE FROM competencia WHERE empleado_id = ?", [empleadoId]);
    return;
  }
  const ids = competencias.map((competencia) => competencia.servicio_id);
  const marcadores = ids.map(() => "?").join(", ");
  await conexion.query(
    `DELETE FROM competencia WHERE empleado_id = ? AND servicio_id NOT IN (${marcadores})`,
    [empleadoId, ...ids]
  );
  for (const competencia of competencias) {
    // El duplicado solo cambia el nivel: conserva la duración y el margen propios.
    await conexion.query(`INSERT INTO competencia (empleado_id, servicio_id, nivel) VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE nivel = VALUES(nivel)`,
      [empleadoId, competencia.servicio_id, competencia.nivel]);
  }
}
