import { afterEach, describe, expect, it, vi } from "vitest";
import { editarLocal } from "./editarLocal";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const { actualizar } = vi.hoisted(() => ({ actualizar: vi.fn() }));
vi.mock("../repositories/actualizarLocal", () => ({ actualizarLocal: actualizar }));
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Peluquería", zona_horaria: "Europe/Madrid" };

describe("editar local", () => {
  it("guarda una zona horaria válida", async () => {
    actualizar.mockResolvedValue(true);
    await editarLocal(datos);
    expect(actualizar).toHaveBeenCalledExactlyOnceWith(datos);
  });
  it("da 409 sin guardar una zona horaria inválida", async () => {
    await expect(editarLocal({ ...datos, zona_horaria: "Europe/Inventada" })).rejects.toThrow(ErrorConflicto);
    expect(actualizar).not.toHaveBeenCalled();
  });
  it("da 404 si falta el local", async () => {
    actualizar.mockResolvedValue(false);
    await expect(editarLocal(datos)).rejects.toThrow(ErrorNoEncontrado);
  });
});
