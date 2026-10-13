import { esquemaUsuarioSesion, type UsuarioSesion } from "@peluqueria/compartido";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

export async function insertarSesion(id: string, usuarioId: number, expiraEn: Date): Promise<void> {
  await pool.query(
    "INSERT INTO sesion (id, usuario_id, expira_en) VALUES (?, ?, ?)",
    [id, usuarioId, expiraEn]
  );
}

export async function buscarUsuarioDeSesion(id: string, ahora: Date): Promise<UsuarioSesion | null> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.nombre, u.nombre_usuario, u.rol
     FROM sesion s JOIN usuario u ON u.id = s.usuario_id
     WHERE s.id = ? AND s.expira_en > ? AND u.activo = TRUE`,
    [id, ahora]
  );
  const fila = filas[0];
  if (!fila) return null;
  return esquemaUsuarioSesion.parse(fila);
}

export async function borrarSesion(id: string): Promise<void> {
  await pool.query("DELETE FROM sesion WHERE id = ?", [id]);
}

export async function borrarSesionesCaducadas(ahora: Date): Promise<void> {
  await pool.query("DELETE FROM sesion WHERE expira_en <= ?", [ahora]);
}
