import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Usuario } from "@peluqueria/compartido";
import { crearUsuario, editarUsuario, listarUsuarios, obtenerUsuario, ponerContrasenaNueva } from "./usuarioService";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  listar: vi.fn(), buscar: vi.fn(), buscarNombre: vi.fn(), insertar: vi.fn(), admins: vi.fn(), actualizar: vi.fn(),
  hash: vi.fn(), actualizarClave: vi.fn(), borrar: vi.fn(), cifrar: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
  conectar: vi.fn(),
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/usuarioRepository", () => ({
  consultarUsuarios: dobles.listar, buscarUsuarioPorId: dobles.buscar, buscarUsuarioPorNombre: dobles.buscarNombre,
  insertarUsuario: dobles.insertar, bloquearAdmins: dobles.admins, actualizarUsuario: dobles.actualizar,
  buscarHashContrasena: dobles.hash, actualizarContrasena: dobles.actualizarClave,
}));
vi.mock("../repositories/sesionRepository", () => ({ borrarSesionesUsuario: dobles.borrar }));
vi.mock("../seguridad/contrasena", () => ({ cifrarContrasena: dobles.cifrar }));

const admin: Usuario = { id: 1, nombre: "Ana", nombre_usuario: "ana", rol: "admin", activo: true, creado_en: "2026-10-13T10:00:00.000Z" };
const otroAdmin: Usuario = { ...admin, id: 2, nombre_usuario: "bea", nombre: "Bea" };
const empleado: Usuario = { ...admin, id: 3, nombre_usuario: "luz", rol: "empleado" };

beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.admins.mockResolvedValue([admin, otroAdmin]);
  dobles.buscar.mockResolvedValue(otroAdmin);
  dobles.buscarNombre.mockResolvedValue(null);
  dobles.cifrar.mockResolvedValue("hash-nuevo");
  dobles.hash.mockResolvedValue("hash-viejo");
});
afterEach(() => vi.resetAllMocks());

describe("listar y obtener usuarios", () => {
  it("devuelve la lista del repositorio y el detalle público", async () => {
    dobles.listar.mockResolvedValue([admin]);
    await expect(listarUsuarios()).resolves.toEqual([admin]);
    await expect(obtenerUsuario(2)).resolves.toEqual(otroAdmin);
    expect(dobles.buscar).toHaveBeenCalledWith(2);
  });

  it("da 404 si el usuario no existe", async () => {
    dobles.buscar.mockResolvedValue(null);
    await expect(obtenerUsuario(99)).rejects.toThrow(ErrorNoEncontrado);
  });
});

describe("crear usuarios", () => {
  const datos = { nombre_usuario: "luz", nombre: "Luz", rol: "empleado" as const, contrasena: "demo1234" };

  it("cifra la contraseña y solo envía el hash al repositorio", async () => {
    dobles.insertar.mockResolvedValue(3);
    await expect(crearUsuario(datos)).resolves.toBe(3);
    expect(dobles.cifrar).toHaveBeenCalledWith("demo1234");
    expect(dobles.insertar).toHaveBeenCalledWith({ nombre_usuario: "luz", nombre: "Luz", rol: "empleado", hash_contrasena: "hash-nuevo" });
  });

  it("rechaza nombres existentes aunque el usuario esté inactivo", async () => {
    dobles.buscarNombre.mockResolvedValue({ activo: false });
    await expect(crearUsuario(datos)).rejects.toThrow("Ese nombre de usuario ya existe");
    expect(dobles.cifrar).not.toHaveBeenCalled();
    expect(dobles.insertar).not.toHaveBeenCalled();
  });

  it("propaga el conflicto de un alta simultánea", async () => {
    dobles.insertar.mockRejectedValue(new ErrorConflicto("Ese nombre de usuario ya existe"));
    await expect(crearUsuario(datos)).rejects.toThrow(ErrorConflicto);
  });
});

describe("editar usuarios", () => {
  it.each([
    { nombre: "Bea", rol: "admin" as const, activo: false, mensaje: "No puedes desactivarte a ti mismo" },
    { nombre: "Bea", rol: "empleado" as const, activo: true, mensaje: "No puedes cambiar tu propio rol" },
  ])("impide alterar el propio acceso: $mensaje", async ({ mensaje, ...datos }) => {
    await expect(editarUsuario(2, datos, 2)).rejects.toThrow(mensaje);
    expect(dobles.actualizar).not.toHaveBeenCalled();
    expect(dobles.borrar).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it("permite editar el propio nombre", async () => {
    const datos = { nombre: "Beatriz", rol: "admin" as const, activo: true };
    await editarUsuario(2, datos, 2);
    expect(dobles.actualizar).toHaveBeenCalledWith(2, datos, dobles.conexion);
    expect(dobles.borrar).not.toHaveBeenCalled();
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
  });

  it.each([
    { nombre: "Bea", rol: "admin" as const, activo: false },
    { nombre: "Bea", rol: "recepcion" as const, activo: true },
  ])("impide perder el último admin activo: %j", async (datos) => {
    dobles.admins.mockResolvedValue([{ ...admin, activo: false }, otroAdmin]);
    await expect(editarUsuario(2, datos, 1)).rejects.toThrow("Debe quedar al menos un admin activo");
    expect(dobles.actualizar).not.toHaveBeenCalled();
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
  });

  it("bloquea los admins antes de leer el destinatario y desactiva junto al borrado de sesiones", async () => {
    const datos = { nombre: "Bea", rol: "admin" as const, activo: false };
    await editarUsuario(2, datos, 1);
    expect(dobles.admins).toHaveBeenCalledWith(dobles.conexion);
    expect(dobles.admins.mock.invocationCallOrder[0]).toBeLessThan(dobles.buscar.mock.invocationCallOrder[0]!);
    expect(dobles.actualizar).toHaveBeenCalledWith(2, datos, dobles.conexion);
    expect(dobles.borrar).toHaveBeenCalledWith(2, dobles.conexion);
    expect(dobles.borrar.mock.invocationCallOrder[0]).toBeLessThan(dobles.conexion.commit.mock.invocationCallOrder[0]!);
  });

  it("permite cambiar el rol de otro admin si queda uno activo", async () => {
    await editarUsuario(2, { nombre: "Bea", rol: "encargado", activo: true }, 1);
    expect(dobles.actualizar).toHaveBeenCalledOnce();
    expect(dobles.borrar).not.toHaveBeenCalled();
  });

  it("permite reactivar a un empleado sin expulsarlo", async () => {
    dobles.buscar.mockResolvedValue({ ...empleado, activo: false });
    await editarUsuario(3, { nombre: "Luz", rol: "empleado", activo: true }, 1);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.borrar).not.toHaveBeenCalled();
  });

  it("permite recuperar un admin activo si no queda ninguno", async () => {
    dobles.admins.mockResolvedValue([{ ...admin, activo: false }]);
    dobles.buscar.mockResolvedValue(empleado);
    await editarUsuario(3, { nombre: "Luz", rol: "admin", activo: true }, 1);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
  });

  it("da 404 y revierte si no existe", async () => {
    dobles.buscar.mockResolvedValue(null);
    await expect(editarUsuario(99, { nombre: "Ausente", rol: "empleado", activo: true }, 1)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.actualizar).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
  });

  it("revierte también la desactivación si falla el borrado de sesiones", async () => {
    dobles.borrar.mockRejectedValue(new Error("Fallo de borrado"));
    await expect(editarUsuario(2, { nombre: "Bea", rol: "admin", activo: false }, 1)).rejects.toThrow("Fallo de borrado");
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});

describe("poner una contraseña nueva", () => {
  it("guarda el hash y expulsa todas las sesiones en la misma transacción", async () => {
    await ponerContrasenaNueva(3, "otra1234");
    expect(dobles.hash).toHaveBeenCalledWith(3, dobles.conexion);
    expect(dobles.cifrar).toHaveBeenCalledWith("otra1234");
    expect(dobles.actualizarClave).toHaveBeenCalledWith(3, "hash-nuevo", dobles.conexion);
    expect(dobles.borrar).toHaveBeenCalledWith(3, dobles.conexion);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it("da 404 si no existe y no cifra ni borra", async () => {
    dobles.hash.mockResolvedValue(null);
    await expect(ponerContrasenaNueva(99, "otra1234")).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.cifrar).not.toHaveBeenCalled();
    expect(dobles.borrar).not.toHaveBeenCalled();
  });

  it("revierte la contraseña si falla la expulsión", async () => {
    dobles.borrar.mockRejectedValue(new Error("Fallo de borrado"));
    await expect(ponerContrasenaNueva(3, "otra1234")).rejects.toThrow("Fallo de borrado");
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});
