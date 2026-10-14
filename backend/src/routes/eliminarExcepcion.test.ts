import { afterEach, describe, expect, it, vi } from "vitest";
import { eliminarExcepcionRouter } from "./eliminarExcepcion";
import { solicitarEnMemoria } from "./solicitarEnMemoria.pruebas";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const { ejecutar } = vi.hoisted(() => ({ ejecutar: vi.fn() }));
vi.mock("../services/eliminarExcepcion", () => ({ eliminarExcepcion: ejecutar }));
afterEach(() => vi.resetAllMocks());
const datos = [];

describe("DELETE /excepciones/:id", () => {
  it("sin sesión da 401 sin ejecutar el caso de uso", async () => {
    expect((await solicitarEnMemoria(eliminarExcepcionRouter, "DELETE", "/excepciones/2", undefined)).codigo).toBe(401);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(["recepcion", "empleado"] as const)("%s recibe 403 sin ejecutar el caso de uso", async (rol) => {
    expect((await solicitarEnMemoria(eliminarExcepcionRouter, "DELETE", "/excepciones/2", undefined, rol)).codigo).toBe(403);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(["admin", "encargado"] as const)("%s obtiene 204", async (rol) => {
    ejecutar.mockResolvedValue(undefined);
    expect(await solicitarEnMemoria(eliminarExcepcionRouter, "DELETE", "/excepciones/2", undefined, rol)).toEqual({ codigo: 204, cuerpo: undefined });
    expect(ejecutar).toHaveBeenCalledExactlyOnceWith(2);
  });
  it.each(["0", "-1", "1.5", "abc"])("id %s da 400", async (id) => {
    expect((await solicitarEnMemoria(eliminarExcepcionRouter, "DELETE", "/excepciones/:id".replace(":id", id), undefined, "admin")).codigo).toBe(400);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each([[new ErrorConflicto("Conflicto de configuración"), 409], [new ErrorNoEncontrado("No encontrado"), 404]] as const)("traduce %s a %s", async (error, codigo) => {
    ejecutar.mockRejectedValue(error);
    expect(await solicitarEnMemoria(eliminarExcepcionRouter, "DELETE", "/excepciones/2", undefined, "encargado")).toEqual({ codigo, cuerpo: { error: error.message } });
  });
});
