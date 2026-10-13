import { afterEach, describe, expect, it, vi } from "vitest";
import { insertarSesion, buscarUsuarioDeSesion, borrarSesion, borrarSesionesCaducadas } from "./sesionRepository";

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

  it("parametriza el borrado y la limpieza, incluyendo el instante de caducidad", async () => {
    await borrarSesion("hash");
    expect(consultar).toHaveBeenCalledWith("DELETE FROM sesion WHERE id = ?", ["hash"]);
    await borrarSesionesCaducadas(ahora);
    expect(consultar).toHaveBeenCalledWith("DELETE FROM sesion WHERE expira_en <= ?", [ahora]);
  });
});
