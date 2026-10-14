import { afterEach, describe, expect, it, vi } from "vitest";
import { editarExcepcionRouter } from "./editarExcepcion";
import { solicitarEnMemoria } from "./solicitarEnMemoria.pruebas";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const { ejecutar } = vi.hoisted(() => ({ ejecutar: vi.fn() }));
vi.mock("../services/editarExcepcion", () => ({ editarExcepcion: ejecutar }));
afterEach(() => vi.resetAllMocks());
const datos = { fecha: "2026-07-12", cerrado: false, motivo: "Bodas", tramos: [{ abre: "09:00", cierra: "14:00" }] };

describe("PATCH /excepciones/:id", () => {
  it("sin sesión da 401 sin ejecutar el caso de uso", async () => {
    expect((await solicitarEnMemoria(editarExcepcionRouter, "PATCH", "/excepciones/2", datos)).codigo).toBe(401);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(["recepcion", "empleado"] as const)("%s recibe 403 sin ejecutar el caso de uso", async (rol) => {
    expect((await solicitarEnMemoria(editarExcepcionRouter, "PATCH", "/excepciones/2", datos, rol)).codigo).toBe(403);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(["admin", "encargado"] as const)("%s obtiene 204", async (rol) => {
    ejecutar.mockResolvedValue(undefined);
    expect(await solicitarEnMemoria(editarExcepcionRouter, "PATCH", "/excepciones/2", datos, rol)).toEqual({ codigo: 204, cuerpo: undefined });
    expect(ejecutar).toHaveBeenCalledExactlyOnceWith(2, datos);
  });
  it.each(["0", "-1", "1.5", "abc"])("id %s da 400", async (id) => {
    expect((await solicitarEnMemoria(editarExcepcionRouter, "PATCH", "/excepciones/:id".replace(":id", id), datos, "admin")).codigo).toBe(400);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it("un cuerpo inválido da 400 antes de llamar al servicio", async () => {
    expect((await solicitarEnMemoria(editarExcepcionRouter, "PATCH", "/excepciones/2", null, "admin")).codigo).toBe(400);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each([[new ErrorConflicto("Conflicto de configuración"), 409], [new ErrorNoEncontrado("No encontrado"), 404]] as const)("traduce %s a %s", async (error, codigo) => {
    ejecutar.mockRejectedValue(error);
    expect(await solicitarEnMemoria(editarExcepcionRouter, "PATCH", "/excepciones/2", datos, "encargado")).toEqual({ codigo, cuerpo: { error: error.message } });
  });
});
