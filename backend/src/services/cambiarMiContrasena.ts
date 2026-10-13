import type { CambiarMiContrasena } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorDatosInvalidos, ErrorNoEncontrado } from "../errores";
import { buscarHashContrasena, actualizarContrasena } from "../repositories/usuarioRepository";
import { borrarOtrasSesiones } from "../repositories/sesionRepository";
import { cifrarContrasena, comprobarContrasena } from "../seguridad/contrasena";
import { cifrarToken } from "../seguridad/sesion";

export async function cambiarMiContrasena(id: number, token: string, datos: CambiarMiContrasena): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const hashAnterior = await buscarHashContrasena(id, conexion);
    if (hashAnterior === null) throw new ErrorNoEncontrado("Usuario no encontrado");
    if (!await comprobarContrasena(datos.actual, hashAnterior)) {
      throw new ErrorDatosInvalidos("La contraseña actual no es correcta");
    }
    const hash = await cifrarContrasena(datos.nueva);
    await actualizarContrasena(id, hash, conexion);
    await borrarOtrasSesiones(id, cifrarToken(token), conexion);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
