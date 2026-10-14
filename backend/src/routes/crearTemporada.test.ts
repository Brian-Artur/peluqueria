import { afterEach, describe, expect, it, vi } from "vitest";
import { crearTemporadaRouter } from "./crearTemporada";
import { solicitarEnMemoria } from "./solicitarEnMemoria.pruebas";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const { ejecutar } = vi.hoisted(() => ({ ejecutar: vi.fn() }));
vi.mock("../services/crearTemporada", () => ({ crearTemporada: ejecutar }));
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Verano", desde: "2026-07-01", hasta: "2026-08-31", activa: true };

describe("POST /temporadas", () => {
  it("sin sesión da 401 sin ejecutar el caso de uso", async () => {
    expect((await solicitarEnMemoria(crearTemporadaRouter, "POST", "/temporadas", datos)).codigo).toBe(401);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(["recepcion", "empleado"] as const)("%s recibe 403 sin ejecutar el caso de uso", async (rol) => {
    expect((await solicitarEnMemoria(crearTemporadaRouter, "POST", "/temporadas", datos, rol)).codigo).toBe(403);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(["admin", "encargado"] as const)("%s obtiene 201", async (rol) => {
    ejecutar.mockResolvedValue(2);
    expect(await solicitarEnMemoria(crearTemporadaRouter, "POST", "/temporadas", datos, rol)).toEqual({ codigo: 201, cuerpo: { id: 2 } });
    expect(ejecutar).toHaveBeenCalledExactlyOnceWith(datos);
  });
  it("un cuerpo inválido da 400 antes de llamar al servicio", async () => {
    expect((await solicitarEnMemoria(crearTemporadaRouter, "POST", "/temporadas", null, "admin")).codigo).toBe(400);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each([[new ErrorConflicto("Conflicto de configuración"), 409], [new ErrorNoEncontrado("No encontrado"), 404]] as const)("traduce %s a %s", async (error, codigo) => {
    ejecutar.mockRejectedValue(error);
    expect(await solicitarEnMemoria(crearTemporadaRouter, "POST", "/temporadas", datos, "encargado")).toEqual({ codigo, cuerpo: { error: error.message } });
  });
});
