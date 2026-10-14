import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";
import { editarTipoRecurso } from "./editarTipoRecurso";

const dobles = vi.hoisted(() => ({ buscar: vi.fn(), hayActivos: vi.fn(), actualizar: vi.fn() }));
vi.mock("../repositories/buscarTipoRecurso", () => ({ buscarTipoRecurso: dobles.buscar }));
vi.mock("../repositories/hayRecursosActivosTipo", () => ({ hayRecursosActivosTipo: dobles.hayActivos }));
vi.mock("../repositories/actualizarTipoRecurso", () => ({ actualizarTipoRecurso: dobles.actualizar }));
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Butaca", activo: false };

describe("editar un tipo de recurso", () => {
  it("da 404 si no existe", async () => {
    dobles.buscar.mockResolvedValue(null);
    await expect(editarTipoRecurso(99, datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.actualizar).not.toHaveBeenCalled();
  });
  it("impide desactivar si quedan recursos activos, incluso fuera de servicio", async () => {
    dobles.buscar.mockResolvedValue({ ...datos, id: 1, activo: true });
    dobles.hayActivos.mockResolvedValue(true);
    await expect(editarTipoRecurso(1, datos)).rejects.toThrow(ErrorConflicto);
    await expect(editarTipoRecurso(1, datos)).rejects.toThrow("Primero da de baja o mueve");
    expect(dobles.hayActivos).toHaveBeenCalledWith(1);
    expect(dobles.actualizar).not.toHaveBeenCalled();
  });
  it("desactiva si no quedan recursos activos", async () => {
    dobles.buscar.mockResolvedValue({ ...datos, id: 1, activo: true });
    dobles.hayActivos.mockResolvedValue(false);
    await editarTipoRecurso(1, datos);
    expect(dobles.actualizar).toHaveBeenCalledWith(1, datos);
  });
  it("permite activar y renombrar sin consultar recursos", async () => {
    dobles.buscar.mockResolvedValue({ ...datos, id: 1 });
    const cambio = { nombre: "Butaca nueva", activo: true };
    await editarTipoRecurso(1, cambio);
    expect(dobles.hayActivos).not.toHaveBeenCalled();
    expect(dobles.actualizar).toHaveBeenCalledWith(1, cambio);
  });
});
