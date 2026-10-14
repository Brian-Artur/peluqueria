import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";
import { validarTipoRecurso } from "./validarTipoRecurso";

const { buscar } = vi.hoisted(() => ({ buscar: vi.fn() }));
vi.mock("../repositories/buscarTipoRecurso", () => ({ buscarTipoRecurso: buscar }));
afterEach(() => vi.resetAllMocks());

describe("validar una nueva asignación de tipo de recurso", () => {
  it("permite no ocupar recurso sin consultar", async () => {
    await validarTipoRecurso(null);
    expect(buscar).not.toHaveBeenCalled();
  });
  it("permite un tipo activo", async () => {
    buscar.mockResolvedValue({ id: 1, nombre: "Butaca", activo: true });
    await expect(validarTipoRecurso(1)).resolves.toBeUndefined();
    expect(buscar).toHaveBeenCalledWith(1);
  });
  it("rechaza un tipo inexistente con 404", async () => {
    buscar.mockResolvedValue(null);
    await expect(validarTipoRecurso(99)).rejects.toThrow(ErrorNoEncontrado);
  });
  it("rechaza un tipo inactivo con 409", async () => {
    buscar.mockResolvedValue({ id: 1, nombre: "Butaca", activo: false });
    await expect(validarTipoRecurso(1)).rejects.toThrow(ErrorConflicto);
  });
});
