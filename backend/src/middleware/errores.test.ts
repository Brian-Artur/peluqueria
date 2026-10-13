import type { Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { ErrorConflicto, ErrorDatosInvalidos, ErrorNoEncontrado } from "../errores";
import { manejadorErrores } from "./errores";

describe("errores de gestión de usuarios", () => {
  it.each([
    [new ErrorDatosInvalidos("La contraseña actual no es correcta"), 400],
    [new ErrorConflicto("Ese nombre de usuario ya existe"), 409],
    [new ErrorConflicto("Debe quedar al menos un admin activo"), 409],
    [new ErrorNoEncontrado("Usuario no encontrado"), 404],
  ])("traduce %s a HTTP %s", (error, codigo) => {
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
    manejadorErrores(error, {} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(codigo);
    expect(res.json).toHaveBeenCalledWith({ error: error.message });
  });
});
