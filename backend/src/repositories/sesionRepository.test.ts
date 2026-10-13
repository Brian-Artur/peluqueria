import { afterEach, describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { insertarSesion, buscarUsuarioDeSesion, borrarSesion, borrarSesionesCaducadas, borrarSesionesUsuario, borrarOtrasSesiones } from "./sesionRepository";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());

describe("persistencia de sesiones sin conectar a la BD", () => {
  const ahora = new Date("2026-10-13T10:00:00Z");
  const usuario = { id: 1, nombre: "Ana", nombre_usuario: "ana", rol: "admin" };

  it("solo consulta sesiones vigentes de usuarios activos y traduce al contrato", async () => {
    consultar.mockResolvedValue([[{ ...usuario, hash_contrasena: "privado", expira_en: ahora }], []]);
    await expect(buscarUsuarioDeSesion("hash", ahora)).resolves.toEqual(usuario);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("s.expira_en > ? AND u.activo = TRUE"), ["hash", ahora]);
  });

  it("devuelve null si la consulta no encuentra una sesión válida", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(buscarUsuarioDeSesion("hash", ahora)).resolves.toBeNull();
  });

  it("parametriza el alta", async () => {
    await insertarSesion("hash", 1, ahora);
    expect(consultar).toHaveBeenCalledWith("INSERT INTO sesion (id, usuario_id, expira_en) VALUES (?, ?, ?)", ["hash", 1, ahora]);
  });

  it("el inicio inserta la sesión en la misma transacción que valida la contraseña", async () => {
    const consultarTransaccion = vi.fn();
    const conexion = { query: consultarTransaccion } as unknown as Connection;
    await insertarSesion("hash", 1, ahora, conexion);
    expect(consultarTransaccion).toHaveBeenCalledWith("INSERT INTO sesion (id, usuario_id, expira_en) VALUES (?, ?, ?)", ["hash", 1, ahora]);
    expect(consultar).not.toHaveBeenCalled();
  });

  it("parametriza el borrado y la limpieza, incluyendo el instante de caducidad", async () => {
    await borrarSesion("hash");
    expect(consultar).toHaveBeenCalledWith("DELETE FROM sesion WHERE id = ?", ["hash"]);
    await borrarSesionesCaducadas(ahora);
    expect(consultar).toHaveBeenCalledWith("DELETE FROM sesion WHERE expira_en <= ?", [ahora]);
  });

  it("borra todas las sesiones del destinatario con la conexión de la transacción", async () => {
    const consultarTransaccion = vi.fn();
    const conexion = { query: consultarTransaccion } as unknown as Connection;
    await borrarSesionesUsuario(3, conexion);
    expect(consultarTransaccion).toHaveBeenCalledWith("DELETE FROM sesion WHERE usuario_id = ?", [3]);
    expect(consultar).not.toHaveBeenCalled();
  });

  it("el cambio propio excluye la sesión actual y las sesiones de otros usuarios", async () => {
    const consultarTransaccion = vi.fn();
    const conexion = { query: consultarTransaccion } as unknown as Connection;
    await borrarOtrasSesiones(3, "hash-actual", conexion);
    expect(consultarTransaccion).toHaveBeenCalledWith("DELETE FROM sesion WHERE usuario_id = ? AND id <> ?", [3, "hash-actual"]);
    expect(consultar).not.toHaveBeenCalled();
  });
});
