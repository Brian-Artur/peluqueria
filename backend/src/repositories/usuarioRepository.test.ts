import { afterEach, describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { buscarUsuarioPorNombre, insertarUsuario } from "./usuarioRepository";
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

  it("inserta con la conexión del script y parámetros", async () => {
    consultar.mockResolvedValue([{ insertId: 1 }, []]);
    await expect(insertarUsuario(datos, conexion)).resolves.toBe(1);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("VALUES (?, ?, ?, ?)"), ["ana", "Ana", "admin", "hash"]);
  });

  it("da un error claro si ya existe el usuario", async () => {
    consultar.mockRejectedValue({ code: "ER_DUP_ENTRY" });
    await expect(insertarUsuario(datos, conexion)).rejects.toThrow(ErrorConflicto);
    await expect(insertarUsuario(datos, conexion)).rejects.toThrow("Ya existe un usuario con ese nombre de usuario");
  });

  it("propaga otros errores", async () => {
    consultar.mockRejectedValue(new Error("Fallo de conexión"));
    await expect(insertarUsuario(datos, conexion)).rejects.toThrow("Fallo de conexión");
  });
});
