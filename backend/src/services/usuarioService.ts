import type { CrearUsuario, EditarUsuario, Usuario } from "@peluqueria/compartido";
import { pool } from "../db";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";
import {
  consultarUsuarios, buscarUsuarioPorId, buscarUsuarioPorNombre, insertarUsuario,
  bloquearAdmins, actualizarUsuario, buscarHashContrasena, actualizarContrasena,
} from "../repositories/usuarioRepository";
import { borrarSesionesUsuario } from "../repositories/sesionRepository";
import { cifrarContrasena } from "../seguridad/contrasena";

export async function listarUsuarios(): Promise<Usuario[]> {
  return consultarUsuarios();
}

export async function obtenerUsuario(id: number): Promise<Usuario> {
  const usuario = await buscarUsuarioPorId(id);
  if (!usuario) throw new ErrorNoEncontrado("Usuario no encontrado");
  return usuario;
}

export async function crearUsuario(datos: CrearUsuario): Promise<number> {
  if (await buscarUsuarioPorNombre(datos.nombre_usuario)) {
    throw new ErrorConflicto("Ese nombre de usuario ya existe");
  }
  const hash_contrasena = await cifrarContrasena(datos.contrasena);
  // La restricción UNIQUE también cubre dos altas simultáneas con el mismo nombre.
  return insertarUsuario({ nombre_usuario: datos.nombre_usuario, nombre: datos.nombre, rol: datos.rol, hash_contrasena });
}

export async function editarUsuario(id: number, datos: EditarUsuario, usuarioConectadoId: number): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const admins = await bloquearAdmins(conexion);
    const usuario = await buscarUsuarioPorId(id, conexion);
    if (!usuario) throw new ErrorNoEncontrado("Usuario no encontrado");

    if (id === usuarioConectadoId) {
      if (!datos.activo) throw new ErrorConflicto("No puedes desactivarte a ti mismo");
      if (datos.rol !== usuario.rol) throw new ErrorConflicto("No puedes cambiar tu propio rol");
    }

    let adminsActivos = 0;
    for (const admin of admins) {
      if (admin.id !== id && admin.activo) adminsActivos += 1;
    }
    if (datos.rol === "admin" && datos.activo) adminsActivos += 1;
    if (adminsActivos === 0) throw new ErrorConflicto("Debe quedar al menos un admin activo");

    await actualizarUsuario(id, datos, conexion);
    if (!datos.activo) await borrarSesionesUsuario(id, conexion);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function ponerContrasenaNueva(id: number, contrasena: string): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const hashAnterior = await buscarHashContrasena(id, conexion);
    if (hashAnterior === null) throw new ErrorNoEncontrado("Usuario no encontrado");
    const hash = await cifrarContrasena(contrasena);
    await actualizarContrasena(id, hash, conexion);
    await borrarSesionesUsuario(id, conexion);
    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}
