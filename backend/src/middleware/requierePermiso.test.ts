import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { esquemaRol, type Permiso, type Rol } from "@peluqueria/compartido";
import { requierePermiso } from "./requierePermiso";
import { manejadorErrores } from "./errores";
import { ErrorNoAutenticado, ErrorProhibido } from "../errores";

function simularRespuesta(rol?: Rol): Response {
  const usuario = rol ? { id: 1, nombre: "Ana", nombre_usuario: "ana", rol } : undefined;
  return {
    locals: { usuario }, status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

describe("requierePermiso", () => {
  const req = {} as Request;

  it("rechaza sin usuario autenticado", () => {
    const next = vi.fn();
    expect(() => requierePermiso("citas:ver")(req, simularRespuesta(), next)).toThrow(ErrorNoAutenticado);
    expect(next).not.toHaveBeenCalled();
  });

  it.each<Permiso>(["citas:gestionar", "clientes:gestionar", "usuarios:gestionar"])(
    "rechaza al empleado sin permiso %s y responde 403", (permiso) => {
      const res = simularRespuesta("empleado");
      const next = vi.fn();
      expect(() => requierePermiso(permiso)(req, res, next)).toThrow(ErrorProhibido);
      expect(next).not.toHaveBeenCalled();
      manejadorErrores(new ErrorProhibido(), req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: "No tienes permiso para esta acción" });
    }
  );

  it.each(esquemaRol.options)("permite completar citas a %s", (rol) => {
    const next = vi.fn();
    requierePermiso("citas:completar")(req, simularRespuesta(rol), next);
    expect(next).toHaveBeenCalledExactlyOnceWith();
  });

  it.each<Rol>(["encargado", "recepcion"])("impide gestionar usuarios a %s", (rol) => {
    expect(() => requierePermiso("usuarios:gestionar")(req, simularRespuesta(rol), vi.fn()))
      .toThrow(ErrorProhibido);
  });

  it("permite al admin gestionar usuarios", () => {
    const next = vi.fn();
    requierePermiso("usuarios:gestionar")(req, simularRespuesta("admin"), next);
    expect(next).toHaveBeenCalledExactlyOnceWith();
  });

  it.each(esquemaRol.options)("permite cambiar la propia contraseña a %s", (rol) => {
    const next = vi.fn();
    requierePermiso("sesion:contrasena")(req, simularRespuesta(rol), next);
    expect(next).toHaveBeenCalledExactlyOnceWith();
  });
});
