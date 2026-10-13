import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { iniciarSesion, obtenerUsuarioSesion, cerrarSesion } from "./sesionService";
import { ErrorNoAutenticado } from "../errores";

const { buscarUsuario, insertar, buscarSesion, borrar, limpiar, cifrar, comprobar } = vi.hoisted(() => ({
  buscarUsuario: vi.fn(), insertar: vi.fn(), buscarSesion: vi.fn(), borrar: vi.fn(),
  limpiar: vi.fn(), cifrar: vi.fn(), comprobar: vi.fn(),
}));
vi.mock("../repositories/usuarioRepository", () => ({ buscarUsuarioPorNombre: buscarUsuario }));
vi.mock("../repositories/sesionRepository", () => ({
  insertarSesion: insertar, buscarUsuarioDeSesion: buscarSesion, borrarSesion: borrar,
  borrarSesionesCaducadas: limpiar,
}));
vi.mock("../seguridad/contrasena", () => ({ cifrarContrasena: cifrar, comprobarContrasena: comprobar }));

const usuario = { id: 1, nombre: "Ana", nombre_usuario: "ana", rol: "admin" };
const credenciales = { nombre_usuario: "ana", contrasena: "demo1234" };
const ahora = new Date("2026-10-13T10:00:00.000Z");

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(ahora);
  buscarUsuario.mockResolvedValue({ usuario, hash_contrasena: "hash", activo: true });
  comprobar.mockResolvedValue(true);
});
afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("iniciar una sesión", () => {
  it("crea un token aleatorio de 32 bytes y guarda solo su SHA-256 durante 12 horas", async () => {
    const sesion = await iniciarSesion(credenciales);
    expect(sesion.usuario).toEqual(usuario);
    expect(sesion.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(sesion.token, "base64url")).toHaveLength(32);
    const hash = createHash("sha256").update(sesion.token).digest("hex");
    expect(insertar).toHaveBeenCalledWith(hash, 1, new Date("2026-10-13T22:00:00.000Z"));
    expect(limpiar).toHaveBeenCalledWith(ahora);
    expect(buscarUsuario).toHaveBeenCalledWith("ana");
    expect(comprobar).toHaveBeenCalledWith("demo1234", "hash");
  });

  it("genera un token distinto en cada inicio", async () => {
    const primera = await iniciarSesion(credenciales);
    const segunda = await iniciarSesion(credenciales);
    expect(primera.token).not.toBe(segunda.token);
  });

  it("calcula un scrypt ficticio para usuarios inexistentes y devuelve el error genérico", async () => {
    buscarUsuario.mockResolvedValue(null);
    await expect(iniciarSesion(credenciales)).rejects.toThrow("Usuario o contraseña incorrectos");
    expect(cifrar).toHaveBeenCalledOnce();
    expect(comprobar).not.toHaveBeenCalled();
    expect(insertar).not.toHaveBeenCalled();
  });

  it.each(["contraseña incorrecta", "usuario inactivo"])("devuelve el mismo 401 para %s", async (caso) => {
    if (caso === "contraseña incorrecta") comprobar.mockResolvedValue(false);
    if (caso === "usuario inactivo") buscarUsuario.mockResolvedValue({ usuario, hash_contrasena: "hash", activo: false });
    await expect(iniciarSesion(credenciales)).rejects.toThrow(ErrorNoAutenticado);
    await expect(iniciarSesion(credenciales)).rejects.toThrow("Usuario o contraseña incorrectos");
    expect(comprobar).toHaveBeenCalledWith("demo1234", "hash");
    expect(insertar).not.toHaveBeenCalled();
    expect(limpiar).toHaveBeenCalledWith(ahora);
  });
});

describe("consultar y cerrar sesiones", () => {
  const token = "token-de-cookie";
  const hash = createHash("sha256").update(token).digest("hex");

  it("busca por el hash del token y la fecha actual", async () => {
    buscarSesion.mockResolvedValue(usuario);
    await expect(obtenerUsuarioSesion(token)).resolves.toEqual(usuario);
    expect(buscarSesion).toHaveBeenCalledWith(hash, ahora);
  });

  it("devuelve null si no queda una sesión válida", async () => {
    buscarSesion.mockResolvedValue(null);
    await expect(obtenerUsuarioSesion(token)).resolves.toBeNull();
  });

  it("borra la sesión por hash al cerrar", async () => {
    await cerrarSesion(token);
    expect(borrar).toHaveBeenCalledWith(hash);
  });
});
