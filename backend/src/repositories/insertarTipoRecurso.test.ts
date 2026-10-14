import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorConflicto } from "../errores";
import { insertarTipoRecurso } from "./insertarTipoRecurso";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Butaca", activo: false };

describe("insertarTipoRecurso sin BD", () => {
  it("parametriza todos los datos de escritura", async () => {
    consultar.mockResolvedValue([{ insertId: 7 }, []]);
    await expect(insertarTipoRecurso(datos)).resolves.toBe(7);
    expect(consultar).toHaveBeenCalledExactlyOnceWith(expect.any(String), ["Butaca", false]);
  });
  it("traduce nombre duplicado a 409", async () => {
    consultar.mockRejectedValue({ code: "ER_DUP_ENTRY" });
    await expect(insertarTipoRecurso(datos)).rejects.toThrow(ErrorConflicto);
    await expect(insertarTipoRecurso(datos)).rejects.toThrow("con ese nombre");
  });
  it("conserva otros errores de BD", async () => {
    const error = new Error("Fallo de conexión");
    consultar.mockRejectedValue(error);
    await expect(insertarTipoRecurso(datos)).rejects.toBe(error);
  });
});
