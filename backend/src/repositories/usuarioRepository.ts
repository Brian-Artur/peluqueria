import { esquemaUsuario, esquemaUsuarioSesion, type EditarUsuario, type Rol, type Usuario, type UsuarioSesion } from "@peluqueria/compartido";
import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db";
import { ErrorConflicto } from "../errores";

interface FilaUsuario extends RowDataPacket {
  id: number;
  nombre_usuario: string;
  nombre: string;
  rol: Rol;
  hash_contrasena: string;
  activo: number;
  creado_en: Date;
}

export interface UsuarioAutenticacion {
  usuario: UsuarioSesion;
  hash_contrasena: string;
  activo: boolean;
}

interface DatosNuevoUsuario {
  nombre_usuario: string;
  nombre: string;
  rol: Rol;
  hash_contrasena: string;
}

export async function buscarUsuarioPorNombre(nombreUsuario: string, conexion?: Connection): Promise<UsuarioAutenticacion | null> {
  const [filas] = await (conexion ?? pool).query<FilaUsuario[]>(
    `SELECT id, nombre_usuario, nombre, rol, hash_contrasena, activo FROM usuario WHERE nombre_usuario = ?${conexion ? " FOR UPDATE" : ""}`,
    [nombreUsuario]
  );
  const fila = filas[0];
  if (!fila) return null;

  return {
    usuario: esquemaUsuarioSesion.parse(fila),
    hash_contrasena: fila.hash_contrasena,
    activo: Boolean(fila.activo),
  };
}

export async function insertarUsuario(datos: DatosNuevoUsuario, conexion: Pick<Connection, "query"> = pool): Promise<number> {
  try {
    const [resultado] = await conexion.query<ResultSetHeader>(
      "INSERT INTO usuario (nombre_usuario, nombre, rol, hash_contrasena) VALUES (?, ?, ?, ?)",
      [datos.nombre_usuario, datos.nombre, datos.rol, datos.hash_contrasena]
    );
    return resultado.insertId;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY") {
      throw new ErrorConflicto("Ese nombre de usuario ya existe");
    }
    throw error;
  }
}

function traducirUsuario(fila: FilaUsuario): Usuario {
  return esquemaUsuario.parse({ ...fila, activo: Boolean(fila.activo), creado_en: fila.creado_en.toISOString() });
}

export async function consultarUsuarios(): Promise<Usuario[]> {
  const [filas] = await pool.query<FilaUsuario[]>(
    "SELECT id, nombre_usuario, nombre, rol, activo, creado_en FROM usuario ORDER BY nombre, id"
  );
  return filas.map(traducirUsuario);
}

export async function buscarUsuarioPorId(id: number, conexion?: Connection): Promise<Usuario | null> {
  const [filas] = await (conexion ?? pool).query<FilaUsuario[]>(
    `SELECT id, nombre_usuario, nombre, rol, activo, creado_en FROM usuario WHERE id = ?${conexion ? " FOR UPDATE" : ""}`,
    [id]
  );
  const fila = filas[0];
  return fila ? traducirUsuario(fila) : null;
}

export async function bloquearAdmins(conexion: Connection): Promise<Usuario[]> {
  // El mismo orden de bloqueo serializa las ediciones que podrían dejar el salón sin admin.
  const [filas] = await conexion.query<FilaUsuario[]>(
    "SELECT id, nombre_usuario, nombre, rol, activo, creado_en FROM usuario WHERE rol = ? ORDER BY id FOR UPDATE",
    ["admin"]
  );
  return filas.map(traducirUsuario);
}

export async function actualizarUsuario(id: number, datos: EditarUsuario, conexion: Connection): Promise<void> {
  await conexion.query("UPDATE usuario SET nombre = ?, rol = ?, activo = ? WHERE id = ?",
    [datos.nombre, datos.rol, datos.activo, id]);
}

export async function buscarHashContrasena(id: number, conexion: Connection): Promise<string | null> {
  const [filas] = await conexion.query<FilaUsuario[]>(
    "SELECT hash_contrasena FROM usuario WHERE id = ? FOR UPDATE", [id]
  );
  return filas[0]?.hash_contrasena ?? null;
}

export async function actualizarContrasena(id: number, hash: string, conexion: Connection): Promise<void> {
  await conexion.query("UPDATE usuario SET hash_contrasena = ? WHERE id = ?", [hash, id]);
}
