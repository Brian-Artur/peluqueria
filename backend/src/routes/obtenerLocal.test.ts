import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaRol } from "@peluqueria/compartido";
import { obtenerLocalRouter } from "./obtenerLocal";
import { solicitarEnMemoria } from "./solicitarEnMemoria.pruebas";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const { ejecutar } = vi.hoisted(() => ({ ejecutar: vi.fn() }));
vi.mock("../services/obtenerLocal", () => ({ obtenerLocal: ejecutar }));
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Peluquería", zona_horaria: "Europe/Madrid" };

describe("GET /local", () => {
  it("sin sesión da 401 sin ejecutar el caso de uso", async () => {
    expect((await solicitarEnMemoria(obtenerLocalRouter, "GET", "/local", undefined)).codigo).toBe(401);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(esquemaRol.options)("%s obtiene 200", async (rol) => {
    ejecutar.mockResolvedValue(datos);
    expect(await solicitarEnMemoria(obtenerLocalRouter, "GET", "/local", undefined, rol)).toEqual({ codigo: 200, cuerpo: datos });
    expect(ejecutar).toHaveBeenCalledExactlyOnceWith();
  });
  it.each([[new ErrorConflicto("Conflicto de configuración"), 409], [new ErrorNoEncontrado("No encontrado"), 404]] as const)("traduce %s a %s", async (error, codigo) => {
    ejecutar.mockRejectedValue(error);
    expect(await solicitarEnMemoria(obtenerLocalRouter, "GET", "/local", undefined, "encargado")).toEqual({ codigo, cuerpo: { error: error.message } });
  });
});
