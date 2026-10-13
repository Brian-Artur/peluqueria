import { randomBytes } from "node:crypto";
import type { Credenciales, UsuarioSesion } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorNoAutenticado } from "../errores";
import { buscarUsuarioPorNombre } from "../repositories/usuarioRepository";
import { insertarSesion, buscarUsuarioDeSesion, borrarSesion, borrarSesionesCaducadas } from "../repositories/sesionRepository";
import { cifrarContrasena, comprobarContrasena } from "../seguridad/contrasena";
import { cifrarToken, DURACION_SESION_SEGUNDOS } from "../seguridad/sesion";

interface SesionIniciada {
  token: string;
  usuario: UsuarioSesion;
}

export async function iniciarSesion(credenciales: Credenciales): Promise<SesionIniciada> {
  const ahora = new Date();
  await borrarSesionesCaducadas(ahora);
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    // El bloqueo impide abrir una sesión con la clave antigua después de una expulsión simultánea.
    const encontrado = await buscarUsuarioPorNombre(credenciales.nombre_usuario, conexion);
    if (!encontrado) {
      // También gastamos un scrypt si no existe: el tiempo no debe revelar usuarios.
      await cifrarContrasena("contraseña ficticia para el inicio de sesión");
      throw new ErrorNoAutenticado("Usuario o contraseña incorrectos");
    }

    const coincide = await comprobarContrasena(credenciales.contrasena, encontrado.hash_contrasena);
    if (!coincide || !encontrado.activo) {
      throw new ErrorNoAutenticado("Usuario o contraseña incorrectos");
    }

    const token = randomBytes(32).toString("base64url");
    const expiraEn = new Date(Date.now() + DURACION_SESION_SEGUNDOS * 1000);
    await insertarSesion(cifrarToken(token), encontrado.usuario.id, expiraEn, conexion);
    await conexion.commit();
    return { token, usuario: encontrado.usuario };
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function obtenerUsuarioSesion(token: string): Promise<UsuarioSesion | null> {
  return buscarUsuarioDeSesion(cifrarToken(token), new Date());
}

export async function cerrarSesion(token: string): Promise<void> {
  await borrarSesion(cifrarToken(token));
}
