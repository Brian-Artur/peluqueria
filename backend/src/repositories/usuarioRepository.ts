import { esquemaUsuarioSesion, type Rol, type UsuarioSesion } from "@peluqueria/compartido";
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

export async function buscarUsuarioPorNombre(nombreUsuario: string): Promise<UsuarioAutenticacion | null> {
  const [filas] = await pool.query<FilaUsuario[]>(
    "SELECT id, nombre_usuario, nombre, rol, hash_contrasena, activo FROM usuario WHERE nombre_usuario = ?",
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

export async function insertarUsuario(datos: DatosNuevoUsuario, conexion: Connection): Promise<number> {
  try {
    const [resultado] = await conexion.query<ResultSetHeader>(
      "INSERT INTO usuario (nombre_usuario, nombre, rol, hash_contrasena) VALUES (?, ?, ?, ?)",
      [datos.nombre_usuario, datos.nombre, datos.rol, datos.hash_contrasena]
    );
    return resultado.insertId;
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY") {
      throw new ErrorConflicto("Ya existe un usuario con ese nombre de usuario");
    }
    throw error;
  }
}
