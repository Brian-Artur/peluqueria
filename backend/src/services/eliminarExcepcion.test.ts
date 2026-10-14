import { afterEach, describe, expect, it, vi } from "vitest";
import { eliminarExcepcion } from "./eliminarExcepcion";
import { ErrorNoEncontrado } from "../errores";

const { borrar } = vi.hoisted(() => ({ borrar: vi.fn() }));
vi.mock("../repositories/borrarExcepcion", () => ({ borrarExcepcion: borrar }));
afterEach(() => vi.resetAllMocks());

describe("eliminar excepción", () => {
  it("elimina una excepción existente", async () => {
    borrar.mockResolvedValue(true);
    await eliminarExcepcion(2);
    expect(borrar).toHaveBeenCalledExactlyOnceWith(2);
  });
  it("da 404 si no existe", async () => {
    borrar.mockResolvedValue(false);
    await expect(eliminarExcepcion(99)).rejects.toThrow(ErrorNoEncontrado);
  });
});
