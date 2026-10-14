import { afterEach, describe, expect, it, vi } from "vitest";
import { editarCategoria } from "./editarCategoria";
import { ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({ buscar: vi.fn(), actualizar: vi.fn() }));
vi.mock("../repositories/categoriaRepository", () => ({
  buscarCategoriaPorId: dobles.buscar, actualizarCategoria: dobles.actualizar,
}));
afterEach(() => vi.resetAllMocks());

describe("editar categorías", () => {
  const datos = { nombre: "Cabello", activa: false };

  it("rechaza una categoría inexistente", async () => {
    dobles.buscar.mockResolvedValue(null);
    await expect(editarCategoria(99, datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.actualizar).not.toHaveBeenCalled();
  });

  it("renombra y desactiva conservando el id", async () => {
    dobles.buscar.mockResolvedValue({ id: 1, nombre: "Pelo", activa: true });
    await editarCategoria(1, datos);
    expect(dobles.actualizar).toHaveBeenCalledWith(1, datos);
  });
});
