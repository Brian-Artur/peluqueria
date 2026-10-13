import { afterEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requiereSesion } from "./requiereSesion";
import { manejadorErrores } from "./errores";
import { ErrorNoAutenticado } from "../errores";

const { obtenerUsuario } = vi.hoisted(() => ({ obtenerUsuario: vi.fn() }));
vi.mock("../services/sesionService", () => ({ obtenerUsuarioSesion: obtenerUsuario }));

afterEach(() => vi.resetAllMocks());

function simularPeticion(cookie?: string): Request {
  return { headers: { cookie } } as Request;
}

function simularRespuesta(): Response {
  return { locals: {}, status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() } as unknown as Response;
}

describe("requiereSesion", () => {
  it("rechaza sin cookie y el manejador responde 401", async () => {
    const req = simularPeticion();
    const res = simularRespuesta();
    const next = vi.fn();
    await expect(requiereSesion(req, res, next)).rejects.toThrow(ErrorNoAutenticado);
    expect(obtenerUsuario).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();

    manejadorErrores(new ErrorNoAutenticado(), req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Debes iniciar sesión" });
  });

  it.each(["sesion=", "tema=claro", "sesion=%ZZ"])("rechaza una cookie vacía o inválida: %s", async (cookie) => {
    await expect(requiereSesion(simularPeticion(cookie), simularRespuesta(), vi.fn()))
      .rejects.toThrow(ErrorNoAutenticado);
    expect(obtenerUsuario).not.toHaveBeenCalled();
  });

  it("rechaza una sesión inexistente, caducada o de usuario inactivo", async () => {
    obtenerUsuario.mockResolvedValue(null);
    const next = vi.fn();
    await expect(requiereSesion(simularPeticion("sesion=token"), simularRespuesta(), next))
      .rejects.toThrow(ErrorNoAutenticado);
    expect(obtenerUsuario).toHaveBeenCalledWith("token");
    expect(next).not.toHaveBeenCalled();
  });

  it("deja el usuario en locals y continúa", async () => {
    const usuario = { id: 1, nombre: "Ana", nombre_usuario: "ana", rol: "empleado" };
    obtenerUsuario.mockResolvedValue(usuario);
    const res = simularRespuesta();
    const next = vi.fn();
    await requiereSesion(simularPeticion("tema=claro; sesion=token"), res, next);
    expect(res.locals.usuario).toEqual(usuario);
    expect(next).toHaveBeenCalledExactlyOnceWith();
  });

  it("propaga los fallos internos sin convertirlos en errores de credenciales", async () => {
    obtenerUsuario.mockRejectedValue(new Error("Fallo de consulta"));
    await expect(requiereSesion(simularPeticion("sesion=token"), simularRespuesta(), vi.fn()))
      .rejects.toThrow("Fallo de consulta");
  });
});
