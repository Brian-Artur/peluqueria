import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaRecurso } from "@peluqueria/compartido";
import { buscarRecurso } from "./buscarRecurso";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());
const fila = { id: 1, nombre: "Butaca 1", tipo_recurso_id: 2, tipo_recurso_nombre: "Butaca", activo: 0, fuera_de_servicio: 1, motivo: "Elevador roto" };

describe("buscarRecurso sin BD", () => {
  it("busca también bajas por id y traduce al contrato", async () => {
    consultar.mockResolvedValue([[{ ...fila, interno: "privado" }], []]);
    const resultado = await buscarRecurso(1);
    expect(resultado).toEqual({ ...fila, activo: false, fuera_de_servicio: true });
    expect(esquemaRecurso.safeParse(resultado).success).toBe(true);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("id = ?"), [1]);
  });
  it("devuelve null si no existe", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(buscarRecurso(99)).resolves.toBeNull();
  });
});
