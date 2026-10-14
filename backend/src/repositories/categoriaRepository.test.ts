import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorConflicto } from "../errores";
import { actualizarCategoria, buscarCategoriaPorId, consultarCategorias, insertarCategoria } from "./categoriaRepository";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());

describe("repositorio de categorías sin BD", () => {
  it("traduce activa a booleano y elimina campos internos", async () => {
    consultar.mockResolvedValue([[{ id: 1, nombre: "Pelo", activa: 0, privado: true }], []]);
    await expect(consultarCategorias()).resolves.toEqual([{ id: 1, nombre: "Pelo", activa: false }]);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("ORDER BY nombre"));
  });

  it("parametriza el id y traduce la categoría encontrada", async () => {
    consultar.mockResolvedValue([[{ id: 2, nombre: "Uñas", activa: 1 }], []]);
    await expect(buscarCategoriaPorId(2)).resolves.toEqual({ id: 2, nombre: "Uñas", activa: true });
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("WHERE id = ?"), [2]);
  });

  it("devuelve null para una categoría inexistente", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(buscarCategoriaPorId(99)).resolves.toBeNull();
  });

  it("parametriza altas y devuelve el id", async () => {
    consultar.mockResolvedValue([{ insertId: 8 }, []]);
    await expect(insertarCategoria({ nombre: "Masaje", activa: true })).resolves.toBe(8);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("VALUES (?, ?)"), ["Masaje", true]);
  });

  it("traduce UNIQUE a 409 tanto en altas como en renombrados", async () => {
    consultar.mockRejectedValue({ code: "ER_DUP_ENTRY" });
    await expect(insertarCategoria({ nombre: "Pelo", activa: true })).rejects.toThrow(ErrorConflicto);
    await expect(actualizarCategoria(2, { nombre: "Pelo", activa: true })).rejects.toThrow("Ya existe una categoría con ese nombre");
  });

  it("no oculta errores distintos de nombre duplicado", async () => {
    const error = new Error("Fallo de conexión");
    consultar.mockRejectedValue(error);
    await expect(insertarCategoria({ nombre: "Pelo", activa: true })).rejects.toBe(error);
    await expect(actualizarCategoria(1, { nombre: "Pelo", activa: true })).rejects.toBe(error);
  });
});
