import { afterEach, describe, expect, it, vi } from "vitest";
import { editarLocalRouter } from "./editarLocal";
import { solicitarEnMemoria } from "./solicitarEnMemoria.pruebas";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const { ejecutar } = vi.hoisted(() => ({ ejecutar: vi.fn() }));
vi.mock("../services/editarLocal", () => ({ editarLocal: ejecutar }));
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Peluquería", zona_horaria: "Europe/Madrid" };

describe("PUT /local", () => {
  it("sin sesión da 401 sin ejecutar el caso de uso", async () => {
    expect((await solicitarEnMemoria(editarLocalRouter, "PUT", "/local", datos)).codigo).toBe(401);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(["recepcion", "empleado"] as const)("%s recibe 403 sin ejecutar el caso de uso", async (rol) => {
    expect((await solicitarEnMemoria(editarLocalRouter, "PUT", "/local", datos, rol)).codigo).toBe(403);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(["admin", "encargado"] as const)("%s obtiene 204", async (rol) => {
    ejecutar.mockResolvedValue(undefined);
    expect(await solicitarEnMemoria(editarLocalRouter, "PUT", "/local", datos, rol)).toEqual({ codigo: 204, cuerpo: undefined });
    expect(ejecutar).toHaveBeenCalledExactlyOnceWith(datos);
  });
  it("un cuerpo inválido da 400 antes de llamar al servicio", async () => {
    expect((await solicitarEnMemoria(editarLocalRouter, "PUT", "/local", null, "admin")).codigo).toBe(400);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each([[new ErrorConflicto("Conflicto de configuración"), 409], [new ErrorNoEncontrado("No encontrado"), 404]] as const)("traduce %s a %s", async (error, codigo) => {
    ejecutar.mockRejectedValue(error);
    expect(await solicitarEnMemoria(editarLocalRouter, "PUT", "/local", datos, "encargado")).toEqual({ codigo, cuerpo: { error: error.message } });
  });
});
