import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaRecurso } from "@peluqueria/compartido";
import { consultarRecursos } from "./consultarRecursos";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());
const fila = { id: 1, nombre: "Butaca 1", tipo_recurso_id: 2, tipo_recurso_nombre: "Butaca", activo: 0, fuera_de_servicio: 1, motivo: "Elevador roto" };

describe("consultarRecursos sin BD", () => {
  it("traduce booleanos, elimina datos internos y respeta el filtro", async () => {
    consultar.mockResolvedValue([[{ ...fila, interno: "privado" }], []]);
    const lista = await consultarRecursos(false);
    expect(lista).toEqual([{ ...fila, activo: false, fuera_de_servicio: true }]);
    expect(esquemaRecurso.safeParse(lista[0]).success).toBe(true);
    expect(consultar).toHaveBeenLastCalledWith(expect.stringContaining("activo = TRUE"), [false]);
    await consultarRecursos(true);
    expect(consultar).toHaveBeenLastCalledWith(expect.any(String), [true]);
  });
  it("devuelve una lista vacía si no hay resultados", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(consultarRecursos(false)).resolves.toEqual([]);
  });
});
