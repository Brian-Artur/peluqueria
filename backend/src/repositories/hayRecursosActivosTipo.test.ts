import { afterEach, describe, expect, it, vi } from "vitest";
import { hayRecursosActivosTipo } from "./hayRecursosActivosTipo";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());

describe("recursos activos de un tipo sin BD", () => {
  it("cuenta activos incluso si están fuera de servicio", async () => {
    consultar.mockResolvedValue([[{ id: 3 }], []]);
    await expect(hayRecursosActivosTipo(2)).resolves.toBe(true);
    expect(consultar).toHaveBeenCalledWith(
      "SELECT id FROM recurso WHERE tipo_recurso_id = ? AND activo = TRUE LIMIT 1", [2],
    );
  });
  it("devuelve false sin activos", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(hayRecursosActivosTipo(2)).resolves.toBe(false);
  });
});
