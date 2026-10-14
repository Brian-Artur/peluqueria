import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";
import { crearServicio } from "./crearServicio";

const dobles = vi.hoisted(() => ({ buscarCategoria: vi.fn(), insertar: vi.fn() }));
vi.mock("../repositories/categoriaRepository", () => ({ buscarCategoriaPorId: dobles.buscarCategoria }));
vi.mock("../repositories/servicioRepository", () => ({ insertarServicio: dobles.insertar }));
afterEach(() => vi.resetAllMocks());

const datos = { nombre: "Corte", categoria_id: 2, duracion_min: 30, precio: "15.00", activo: true };

describe("crear un servicio", () => {
  it("admite una categoría activa", async () => {
    dobles.buscarCategoria.mockResolvedValue({ id: 2, nombre: "Pelo", activa: true });
    dobles.insertar.mockResolvedValue(5);
    await expect(crearServicio(datos)).resolves.toBe(5);
    expect(dobles.insertar).toHaveBeenCalledWith(datos);
  });

  it("admite Sin categoría sin consultar categorías", async () => {
    dobles.insertar.mockResolvedValue(5);
    await expect(crearServicio({ ...datos, categoria_id: null })).resolves.toBe(5);
    expect(dobles.buscarCategoria).not.toHaveBeenCalled();
  });

  it("rechaza asignar una categoría inactiva con 409", async () => {
    dobles.buscarCategoria.mockResolvedValue({ id: 2, nombre: "Pelo", activa: false });
    await expect(crearServicio(datos)).rejects.toThrow(ErrorConflicto);
    expect(dobles.insertar).not.toHaveBeenCalled();
  });

  it("rechaza una categoría inexistente con 404", async () => {
    dobles.buscarCategoria.mockResolvedValue(null);
    await expect(crearServicio(datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.insertar).not.toHaveBeenCalled();
  });
});
