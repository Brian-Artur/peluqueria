import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorConflicto } from "../errores";
import { actualizarRecurso } from "./actualizarRecurso";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Butaca 1", tipo_recurso_id: 2, fuera_de_servicio: true, motivo: "Elevador roto", activo: false };

describe("actualizarRecurso sin BD", () => {
  it("parametriza todos los datos de escritura", async () => {
    consultar.mockResolvedValue([{ insertId: 7 }, []]);
    await actualizarRecurso(1, datos);
    expect(consultar).toHaveBeenCalledExactlyOnceWith(expect.any(String), ["Butaca 1", 2, true, "Elevador roto", false, 1]);
  });
  it("traduce nombre duplicado a 409", async () => {
    consultar.mockRejectedValue({ code: "ER_DUP_ENTRY" });
    await expect(actualizarRecurso(1, datos)).rejects.toThrow(ErrorConflicto);
    await expect(actualizarRecurso(1, datos)).rejects.toThrow("con ese nombre");
  });
  it("conserva otros errores de BD", async () => {
    const error = new Error("Fallo de conexión");
    consultar.mockRejectedValue(error);
    await expect(actualizarRecurso(1, datos)).rejects.toBe(error);
  });
});
