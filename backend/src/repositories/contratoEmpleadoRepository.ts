import { esquemaContrato, type Contrato, type NuevoContrato } from "@peluqueria/compartido";
import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

interface FilaContrato extends RowDataPacket, Contrato {}

export async function consultarContratos(empleadoId: number, conexion?: Connection): Promise<Contrato[]> {
  // DATE_FORMAT conserva días civiles como texto, sin conversión de zona horaria del pool.
  const [filas] = await (conexion ?? pool).query<FilaContrato[]>(
    `SELECT c.id, c.tipo, DATE_FORMAT(c.desde, '%Y-%m-%d') AS desde,
      DATE_FORMAT(c.hasta, '%Y-%m-%d') AS hasta, c.tutor_id, t.nombre AS tutor_nombre, c.empresa
      FROM contrato_empleado c LEFT JOIN empleado t ON t.id = c.tutor_id
      WHERE c.empleado_id = ? ORDER BY c.desde DESC, c.id DESC`, [empleadoId]
  );
  return filas.map((fila) => esquemaContrato.parse(fila));
}

export async function insertarContrato(empleadoId: number, datos: NuevoContrato, conexion: Connection): Promise<number> {
  const [resultado] = await conexion.query<ResultSetHeader>(
    "INSERT INTO contrato_empleado (empleado_id, tipo, desde, tutor_id, empresa) VALUES (?, ?, ?, ?, ?)",
    [empleadoId, datos.tipo, datos.desde, datos.tutor_id, datos.empresa]
  );
  return resultado.insertId;
}

export async function cerrarContrato(id: number, hasta: string, conexion: Connection): Promise<void> {
  await conexion.query("UPDATE contrato_empleado SET hasta = ? WHERE id = ?", [hasta, id]);
}
