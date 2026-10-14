import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorConflicto } from "../errores";
import { insertarRecurso } from "./insertarRecurso";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Butaca 1", tipo_recurso_id: 2, fuera_de_servicio: true, motivo: "Elevador roto", activo: false };

describe("insertarRecurso sin BD", () => {
  it("parametriza todos los datos de escritura", async () => {
    consultar.mockResolvedValue([{ insertId: 7 }, []]);
    await expect(insertarRecurso(datos)).resolves.toBe(7);
    expect(consultar).toHaveBeenCalledExactlyOnceWith(expect.any(String), ["Butaca 1", 2, true, "Elevador roto", false]);
  });
  it("traduce nombre duplicado a 409", async () => {
    consultar.mockRejectedValue({ code: "ER_DUP_ENTRY" });
    await expect(insertarRecurso(datos)).rejects.toThrow(ErrorConflicto);
    await expect(insertarRecurso(datos)).rejects.toThrow("con ese nombre");
  });
  it("conserva otros errores de BD", async () => {
    const error = new Error("Fallo de conexión");
    consultar.mockRejectedValue(error);
    await expect(insertarRecurso(datos)).rejects.toBe(error);
  });
});
