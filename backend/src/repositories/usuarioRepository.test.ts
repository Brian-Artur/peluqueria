import { afterEach, describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import {
  buscarUsuarioPorNombre, insertarUsuario, consultarUsuarios, buscarUsuarioPorId,
  bloquearAdmins, actualizarUsuario, buscarHashContrasena, actualizarContrasena,
} from "./usuarioRepository";
import { ErrorConflicto } from "../errores";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());

describe("persistencia de usuarios sin conectar a la BD", () => {
  const usuario = { id: 1, nombre: "Ana", nombre_usuario: "ana", rol: "admin" };

  it.each([0, 1])("traduce activo=%s y separa los datos públicos y privados", async (activo) => {
    consultar.mockResolvedValue([[{ ...usuario, hash_contrasena: "hash", activo, creado_en: "privado" }], []]);
    await expect(buscarUsuarioPorNombre("ana")).resolves.toEqual({ usuario, hash_contrasena: "hash", activo: Boolean(activo) });
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("WHERE nombre_usuario = ?"), ["ana"]);
  });

  it("devuelve null si no existe", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(buscarUsuarioPorNombre("ausente")).resolves.toBeNull();
  });

  const datos = { nombre_usuario: "ana", nombre: "Ana", rol: "admin" as const, hash_contrasena: "hash" };
  const conexion = { query: consultar } as unknown as Connection;

  it("bloquea el usuario durante la validación del inicio de sesión", async () => {
    consultar.mockResolvedValue([[{ ...usuario, hash_contrasena: "hash", activo: 1 }], []]);
    await buscarUsuarioPorNombre("ana", conexion);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("WHERE nombre_usuario = ? FOR UPDATE"), ["ana"]);
  });

  it("inserta con la conexión del script y parámetros", async () => {
    consultar.mockResolvedValue([{ insertId: 1 }, []]);
    await expect(insertarUsuario(datos, conexion)).resolves.toBe(1);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("VALUES (?, ?, ?, ?)"), ["ana", "Ana", "admin", "hash"]);
  });

  it("da un error claro si ya existe el usuario", async () => {
    consultar.mockRejectedValue({ code: "ER_DUP_ENTRY" });
    await expect(insertarUsuario(datos, conexion)).rejects.toThrow(ErrorConflicto);
    await expect(insertarUsuario(datos, conexion)).rejects.toThrow("Ese nombre de usuario ya existe");
  });

  it("propaga otros errores", async () => {
    consultar.mockRejectedValue(new Error("Fallo de conexión"));
    await expect(insertarUsuario(datos, conexion)).rejects.toThrow("Fallo de conexión");
  });

  const creadoEn = new Date("2026-10-13T10:00:00.000Z");
  const fila = { ...usuario, activo: 1, creado_en: creadoEn, hash_contrasena: "privado" };
  const publico = { ...usuario, activo: true, creado_en: creadoEn.toISOString() };

  it("lista ordenada por nombre con fecha ISO, booleano y sin hash", async () => {
    consultar.mockResolvedValue([[fila, { ...fila, id: 2, activo: 0 }], []]);
    await expect(consultarUsuarios()).resolves.toEqual([publico, { ...publico, id: 2, activo: false }]);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("ORDER BY nombre, id"));
    expect(consultar.mock.calls[0]![0]).not.toContain("hash_contrasena");
  });

  it("el detalle devuelve datos públicos y parametriza el id", async () => {
    consultar.mockResolvedValue([[fila], []]);
    await expect(buscarUsuarioPorId(1)).resolves.toEqual(publico);
    expect(consultar).toHaveBeenCalledWith(expect.not.stringContaining("FOR UPDATE"), [1]);
  });

  it("el detalle inexistente devuelve null", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(buscarUsuarioPorId(99)).resolves.toBeNull();
  });

  it("bloquea el destinatario cuando se proporciona una conexión transaccional", async () => {
    consultar.mockResolvedValue([[fila], []]);
    await buscarUsuarioPorId(1, conexion);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("WHERE id = ? FOR UPDATE"), [1]);
  });

  it("bloquea todos los admins en un orden estable, incluyendo inactivos", async () => {
    consultar.mockResolvedValue([[fila, { ...fila, id: 2, activo: 0 }], []]);
    await expect(bloquearAdmins(conexion)).resolves.toEqual([publico, { ...publico, id: 2, activo: false }]);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("WHERE rol = ? ORDER BY id FOR UPDATE"), ["admin"]);
  });

  it("actualiza solo nombre, rol y activo con parámetros", async () => {
    await actualizarUsuario(1, { nombre: "Ana María", rol: "encargado", activo: false }, conexion);
    expect(consultar).toHaveBeenCalledWith("UPDATE usuario SET nombre = ?, rol = ?, activo = ? WHERE id = ?", ["Ana María", "encargado", false, 1]);
  });

  it("lee y actualiza el hash bajo el bloqueo del usuario", async () => {
    consultar.mockResolvedValue([[{ hash_contrasena: "hash-viejo" }], []]);
    await expect(buscarHashContrasena(1, conexion)).resolves.toBe("hash-viejo");
    expect(consultar).toHaveBeenCalledWith("SELECT hash_contrasena FROM usuario WHERE id = ? FOR UPDATE", [1]);
    await actualizarContrasena(1, "hash-nuevo", conexion);
    expect(consultar).toHaveBeenCalledWith("UPDATE usuario SET hash_contrasena = ? WHERE id = ?", ["hash-nuevo", 1]);
  });

  it("no encuentra hash para un usuario inexistente", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(buscarHashContrasena(99, conexion)).resolves.toBeNull();
  });
});
