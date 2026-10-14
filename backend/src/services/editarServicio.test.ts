import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";
import { editarServicio } from "./editarServicio";

const dobles = vi.hoisted(() => ({ buscarServicio: vi.fn(), buscarCategoria: vi.fn(), buscarTipo: vi.fn(), actualizar: vi.fn() }));
vi.mock("../repositories/buscarTipoRecurso", () => ({ buscarTipoRecurso: dobles.buscarTipo }));
vi.mock("../repositories/categoriaRepository", () => ({ buscarCategoriaPorId: dobles.buscarCategoria }));
vi.mock("../repositories/servicioRepository", () => ({
  findServicioById: dobles.buscarServicio, actualizarServicio: dobles.actualizar,
}));
afterEach(() => vi.resetAllMocks());

const datos = { nombre: "Corte", tipo_recurso_id: null, categoria_id: 2, duracion_min: 45, margen_min: 10, dificultad: "alta" as const, precio: "20.00", activo: true };
const anterior = { ...datos, id: 1, tipo_recurso_nombre: null, categoria_nombre: "Pelo", duracion_min: 30, margen_min: 5, dificultad: "media" as const, precio: "15.00" };

describe("editar un servicio", () => {
  it("conserva el tipo anterior inactivo y permite quitarlo", async () => {
    dobles.buscarServicio.mockResolvedValue({ ...anterior, tipo_recurso_id: 3 });
    await editarServicio(1, { ...datos, tipo_recurso_id: 3 });
    await editarServicio(1, datos);
    expect(dobles.buscarTipo).not.toHaveBeenCalled();
    expect(dobles.actualizar).toHaveBeenLastCalledWith(1, datos);
  });

  it("permite un tipo nuevo activo y rechaza uno inactivo o inexistente", async () => {
    dobles.buscarServicio.mockResolvedValue(anterior);
    dobles.buscarTipo.mockResolvedValue({ id: 3, activo: true });
    await editarServicio(1, { ...datos, tipo_recurso_id: 3 });
    expect(dobles.actualizar).toHaveBeenCalledWith(1, { ...datos, tipo_recurso_id: 3 });
    dobles.actualizar.mockClear();
    dobles.buscarTipo.mockResolvedValue({ id: 3, activo: false });
    await expect(editarServicio(1, { ...datos, tipo_recurso_id: 3 })).rejects.toThrow(ErrorConflicto);
    dobles.buscarTipo.mockResolvedValue(null);
    await expect(editarServicio(1, { ...datos, tipo_recurso_id: 99 })).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.actualizar).not.toHaveBeenCalled();
  });

  it("rechaza un servicio inexistente con 404", async () => {
    dobles.buscarServicio.mockResolvedValue(null);
    await expect(editarServicio(99, datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.actualizar).not.toHaveBeenCalled();
  });

  it("conserva la categoría anterior aunque se haya desactivado", async () => {
    dobles.buscarServicio.mockResolvedValue(anterior);
    await editarServicio(1, datos);
    expect(dobles.buscarCategoria).not.toHaveBeenCalled();
    expect(dobles.actualizar).toHaveBeenCalledWith(1, datos);
  });

  it("permite cambiar a una categoría activa", async () => {
    dobles.buscarServicio.mockResolvedValue(anterior);
    dobles.buscarCategoria.mockResolvedValue({ id: 3, nombre: "Estética", activa: true });
    await editarServicio(1, { ...datos, categoria_id: 3 });
    expect(dobles.actualizar).toHaveBeenCalledWith(1, { ...datos, categoria_id: 3 });
  });

  it("impide cambiar a una categoría inactiva", async () => {
    dobles.buscarServicio.mockResolvedValue(anterior);
    dobles.buscarCategoria.mockResolvedValue({ id: 3, nombre: "Estética", activa: false });
    await expect(editarServicio(1, { ...datos, categoria_id: 3 })).rejects.toThrow(ErrorConflicto);
    expect(dobles.actualizar).not.toHaveBeenCalled();
  });

  it("permite quitar la categoría y desactivar sin borrar", async () => {
    dobles.buscarServicio.mockResolvedValue(anterior);
    await editarServicio(1, { ...datos, categoria_id: null, activo: false });
    expect(dobles.actualizar).toHaveBeenCalledWith(1, { ...datos, categoria_id: null, activo: false });
    expect(dobles.buscarCategoria).not.toHaveBeenCalled();
  });
});
