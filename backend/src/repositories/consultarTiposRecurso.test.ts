import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaTipoRecurso } from "@peluqueria/compartido";
import { consultarTiposRecurso } from "./consultarTiposRecurso";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());
const fila = { id: 1, nombre: "Butaca", activo: 0 };

describe("consultarTiposRecurso sin BD", () => {
  it("traduce booleanos, elimina datos internos y respeta el filtro", async () => {
    consultar.mockResolvedValue([[{ ...fila, interno: "privado" }], []]);
    const lista = await consultarTiposRecurso(false);
    expect(lista).toEqual([{ ...fila, activo: false }]);
    expect(esquemaTipoRecurso.safeParse(lista[0]).success).toBe(true);
    expect(consultar).toHaveBeenLastCalledWith(expect.stringContaining("activo = TRUE"), [false]);
    await consultarTiposRecurso(true);
    expect(consultar).toHaveBeenLastCalledWith(expect.any(String), [true]);
  });
  it("devuelve una lista vacía si no hay resultados", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(consultarTiposRecurso(false)).resolves.toEqual([]);
  });
});
