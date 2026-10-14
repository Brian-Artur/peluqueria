import { afterEach, describe, expect, it, vi } from "vitest";
import { obtenerLocal } from "./obtenerLocal";
import { ErrorNoEncontrado } from "../errores";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../repositories/consultarLocal", () => ({ consultarLocal: consultar }));
afterEach(() => vi.resetAllMocks());

describe("obtener local", () => {
  it("devuelve los datos guardados", async () => {
    const local = { nombre: "Peluquería", zona_horaria: "Europe/Madrid" };
    consultar.mockResolvedValue(local);
    await expect(obtenerLocal()).resolves.toEqual(local);
  });
  it("da 404 si falta la fila única", async () => {
    consultar.mockResolvedValue(null);
    await expect(obtenerLocal()).rejects.toThrow(ErrorNoEncontrado);
  });
});
