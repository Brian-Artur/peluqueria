import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cambiarMiContrasena } from "./cambiarMiContrasena";
import { ErrorDatosInvalidos, ErrorNoEncontrado } from "../errores";
import { cifrarToken } from "../seguridad/sesion";

const dobles = vi.hoisted(() => ({
  buscar: vi.fn(), actualizar: vi.fn(), borrar: vi.fn(), cifrar: vi.fn(), comprobar: vi.fn(), conectar: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/usuarioRepository", () => ({ buscarHashContrasena: dobles.buscar, actualizarContrasena: dobles.actualizar }));
vi.mock("../repositories/sesionRepository", () => ({ borrarOtrasSesiones: dobles.borrar }));
vi.mock("../seguridad/contrasena", () => ({ cifrarContrasena: dobles.cifrar, comprobarContrasena: dobles.comprobar }));

const datos = { actual: "demo1234", nueva: "otra1234" };
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.buscar.mockResolvedValue("hash-viejo");
  dobles.comprobar.mockResolvedValue(true);
  dobles.cifrar.mockResolvedValue("hash-nuevo");
});
afterEach(() => vi.resetAllMocks());

describe("cambiar la propia contraseña", () => {
  it("comprueba la actual, cifra la nueva y conserva solo la sesión actual por su hash", async () => {
    await cambiarMiContrasena(3, "cookie-actual", datos);
    expect(dobles.buscar).toHaveBeenCalledWith(3, dobles.conexion);
    expect(dobles.comprobar).toHaveBeenCalledWith("demo1234", "hash-viejo");
    expect(dobles.cifrar).toHaveBeenCalledWith("otra1234");
    expect(dobles.actualizar).toHaveBeenCalledWith(3, "hash-nuevo", dobles.conexion);
    expect(dobles.borrar).toHaveBeenCalledWith(3, cifrarToken("cookie-actual"), dobles.conexion);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it("da 400 con mensaje claro si la actual es incorrecta y no modifica nada", async () => {
    dobles.comprobar.mockResolvedValue(false);
    await expect(cambiarMiContrasena(3, "cookie", datos)).rejects.toThrow(ErrorDatosInvalidos);
    await expect(cambiarMiContrasena(3, "cookie", datos)).rejects.toThrow("La contraseña actual no es correcta");
    expect(dobles.cifrar).not.toHaveBeenCalled();
    expect(dobles.actualizar).not.toHaveBeenCalled();
    expect(dobles.borrar).not.toHaveBeenCalled();
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
  });

  it("da 404 si no existe", async () => {
    dobles.buscar.mockResolvedValue(null);
    await expect(cambiarMiContrasena(99, "cookie", datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.comprobar).not.toHaveBeenCalled();
  });

  it("revierte la contraseña si no puede borrar las otras sesiones", async () => {
    dobles.borrar.mockRejectedValue(new Error("Fallo de borrado"));
    await expect(cambiarMiContrasena(3, "cookie", datos)).rejects.toThrow("Fallo de borrado");
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});
