import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaTipoRecurso } from "@peluqueria/compartido";
import { buscarTipoRecurso } from "./buscarTipoRecurso";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());
const fila = { id: 1, nombre: "Butaca", activo: 0 };

describe("buscarTipoRecurso sin BD", () => {
  it("busca también bajas por id y traduce al contrato", async () => {
    consultar.mockResolvedValue([[{ ...fila, interno: "privado" }], []]);
    const resultado = await buscarTipoRecurso(1);
    expect(resultado).toEqual({ ...fila, activo: false });
    expect(esquemaTipoRecurso.safeParse(resultado).success).toBe(true);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("id = ?"), [1]);
  });
  it("devuelve null si no existe", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(buscarTipoRecurso(99)).resolves.toBeNull();
  });
});
