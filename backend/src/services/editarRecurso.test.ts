import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";
import { editarRecurso } from "./editarRecurso";

const dobles = vi.hoisted(() => ({ buscar: vi.fn(), buscarTipo: vi.fn(), actualizar: vi.fn() }));
vi.mock("../repositories/buscarRecurso", () => ({ buscarRecurso: dobles.buscar }));
vi.mock("../repositories/buscarTipoRecurso", () => ({ buscarTipoRecurso: dobles.buscarTipo }));
vi.mock("../repositories/actualizarRecurso", () => ({ actualizarRecurso: dobles.actualizar }));
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Butaca 1", tipo_recurso_id: 1, fuera_de_servicio: false, motivo: null, activo: true };

describe("editar un recurso", () => {
  it("da 404 si no existe y no escribe", async () => {
    dobles.buscar.mockResolvedValue(null);
    await expect(editarRecurso(99, datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.actualizar).not.toHaveBeenCalled();
  });
  it("conserva el tipo anterior aunque esté inactivo al renombrar o cambiar estado", async () => {
    dobles.buscar.mockResolvedValue({ ...datos, id: 1 });
    const cambio = { ...datos, nombre: "Butaca reparada", activo: false, fuera_de_servicio: true, motivo: "Reparación" };
    await editarRecurso(1, cambio);
    expect(dobles.buscarTipo).not.toHaveBeenCalled();
    expect(dobles.actualizar).toHaveBeenCalledWith(1, cambio);
  });
  it("permite mover a un tipo activo", async () => {
    dobles.buscar.mockResolvedValue({ ...datos, id: 1 });
    dobles.buscarTipo.mockResolvedValue({ id: 2, activo: true });
    await editarRecurso(1, { ...datos, tipo_recurso_id: 2 });
    expect(dobles.actualizar).toHaveBeenCalledWith(1, { ...datos, tipo_recurso_id: 2 });
  });
  it("rechaza mover a un tipo inactivo", async () => {
    dobles.buscar.mockResolvedValue({ ...datos, id: 1 });
    dobles.buscarTipo.mockResolvedValue({ id: 2, activo: false });
    await expect(editarRecurso(1, { ...datos, tipo_recurso_id: 2 })).rejects.toThrow(ErrorConflicto);
    expect(dobles.actualizar).not.toHaveBeenCalled();
  });
  it("rechaza mover a un tipo inexistente", async () => {
    dobles.buscar.mockResolvedValue({ ...datos, id: 1 });
    dobles.buscarTipo.mockResolvedValue(null);
    await expect(editarRecurso(1, { ...datos, tipo_recurso_id: 99 })).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.actualizar).not.toHaveBeenCalled();
  });
});
