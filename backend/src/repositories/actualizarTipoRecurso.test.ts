import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorConflicto } from "../errores";
import { actualizarTipoRecurso } from "./actualizarTipoRecurso";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Butaca", activo: false };

describe("actualizarTipoRecurso sin BD", () => {
  it("parametriza todos los datos de escritura", async () => {
    consultar.mockResolvedValue([{ insertId: 7 }, []]);
    await actualizarTipoRecurso(1, datos);
    expect(consultar).toHaveBeenCalledExactlyOnceWith(expect.any(String), ["Butaca", false, 1]);
  });
  it("traduce nombre duplicado a 409", async () => {
    consultar.mockRejectedValue({ code: "ER_DUP_ENTRY" });
    await expect(actualizarTipoRecurso(1, datos)).rejects.toThrow(ErrorConflicto);
    await expect(actualizarTipoRecurso(1, datos)).rejects.toThrow("con ese nombre");
  });
  it("conserva otros errores de BD", async () => {
    const error = new Error("Fallo de conexión");
    consultar.mockRejectedValue(error);
    await expect(actualizarTipoRecurso(1, datos)).rejects.toBe(error);
  });
});
