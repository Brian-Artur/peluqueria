import type { Request, Response, Router } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaRol, type Rol } from "@peluqueria/compartido";
import { usuariosRouter } from "./usuarios";
import { sesionRouter } from "./sesion";
import { manejadorErrores } from "../middleware/errores";
import { ErrorConflicto, ErrorDatosInvalidos, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  listar: vi.fn(), obtener: vi.fn(), crear: vi.fn(), editar: vi.fn(), ponerClave: vi.fn(), miClave: vi.fn(),
}));
vi.mock("../services/usuarioService", () => ({
  listarUsuarios: dobles.listar, obtenerUsuario: dobles.obtener, crearUsuario: dobles.crear,
  editarUsuario: dobles.editar, ponerContrasenaNueva: dobles.ponerClave,
}));
vi.mock("../services/cambiarMiContrasena", () => ({ cambiarMiContrasena: dobles.miClave }));
vi.mock("../services/sesionService", () => ({ iniciarSesion: vi.fn(), cerrarSesion: vi.fn() }));
afterEach(() => vi.resetAllMocks());

type Respuesta = { codigo: number; cuerpo: unknown };

// Ejecutamos el router y el middleware de errores en memoria, sin sockets ni servidor.
function solicitar(router: Router, metodo: string, url: string, cuerpo?: unknown, rol?: Rol): Promise<Respuesta> {
  return new Promise((resolve, reject) => {
    let codigo = 200;
    const req = { method: metodo, url, body: cuerpo, headers: { cookie: "sesion=token-actual" } } as Request;
    const usuario = rol ? { id: 7, nombre: "Ana", nombre_usuario: "ana", rol } : undefined;
    const res = {
      locals: { usuario },
      status: (valor: number): Response => { codigo = valor; return res; },
      json: (datos: unknown): Response => { resolve({ codigo, cuerpo: datos }); return res; },
      send: (): Response => { resolve({ codigo, cuerpo: undefined }); return res; },
    } as unknown as Response;
    router(req, res, (error?: unknown) => {
      if (!error) { reject(new Error(`Ruta no encontrada: ${metodo} ${url}`)); return; }
      manejadorErrores(error, req, res, reject);
    });
  });
}

const alta = { nombre_usuario: "nuevo", nombre: "Nuevo", rol: "empleado", contrasena: "demo1234" };
const edicion = { nombre: "Nuevo", rol: "encargado", activo: true };
const rutas: [string, string, unknown][] = [
  ["GET", "/usuarios", undefined], ["GET", "/usuarios/2", undefined],
  ["POST", "/usuarios", alta], ["PATCH", "/usuarios/2", edicion],
  ["PUT", "/usuarios/2/contrasena", { contrasena: "otra1234" }],
];

describe("permisos en todas las rutas de usuarios", () => {
  it.each(rutas)("sin sesión: %s %s devuelve 401", async (metodo, url, datos) => {
    expect((await solicitar(usuariosRouter, metodo, url, datos)).codigo).toBe(401);
  });

  for (const rol of ["encargado", "recepcion", "empleado"] as const) {
    it.each(rutas)(`${rol}: %s %s devuelve 403`, async (metodo, url, datos) => {
      expect((await solicitar(usuariosRouter, metodo, url, datos, rol)).codigo).toBe(403);
      expect(dobles.listar).not.toHaveBeenCalled();
      expect(dobles.obtener).not.toHaveBeenCalled();
      expect(dobles.crear).not.toHaveBeenCalled();
      expect(dobles.editar).not.toHaveBeenCalled();
      expect(dobles.ponerClave).not.toHaveBeenCalled();
    });
  }
});

describe("contratos y respuestas de usuarios", () => {
  it("lista y detalle devuelven 200", async () => {
    const usuario = { id: 2, nombre_usuario: "nuevo", nombre: "Nuevo", rol: "empleado", activo: true, creado_en: "2026-10-13T10:00:00.000Z" };
    dobles.listar.mockResolvedValue([usuario]);
    dobles.obtener.mockResolvedValue(usuario);
    expect(await solicitar(usuariosRouter, "GET", "/usuarios", undefined, "admin")).toEqual({ codigo: 200, cuerpo: [usuario] });
    expect(await solicitar(usuariosRouter, "GET", "/usuarios/2", undefined, "admin")).toEqual({ codigo: 200, cuerpo: usuario });
    expect(dobles.obtener).toHaveBeenCalledWith(2);
  });

  it("crea con 201 y solo devuelve el id", async () => {
    dobles.crear.mockResolvedValue(2);
    expect(await solicitar(usuariosRouter, "POST", "/usuarios", alta, "admin")).toEqual({ codigo: 201, cuerpo: { id: 2 } });
    expect(dobles.crear).toHaveBeenCalledWith(alta);
  });

  it("edita con 204 y toma al actor de la sesión", async () => {
    expect(await solicitar(usuariosRouter, "PATCH", "/usuarios/2", { ...edicion, usuarioConectadoId: 2 }, "admin"))
      .toEqual({ codigo: 204, cuerpo: undefined });
    expect(dobles.editar).toHaveBeenCalledWith(2, edicion, 7);
  });

  it("pone una contraseña con 204", async () => {
    expect((await solicitar(usuariosRouter, "PUT", "/usuarios/2/contrasena", { contrasena: "otra1234" }, "admin")).codigo).toBe(204);
    expect(dobles.ponerClave).toHaveBeenCalledWith(2, "otra1234");
  });

  it.each(["no-numero", "0", "-1", "1.5"])("rechaza el id %s en lectura, edición y contraseña", async (id) => {
    expect((await solicitar(usuariosRouter, "GET", `/usuarios/${id}`, undefined, "admin")).codigo).toBe(400);
    expect((await solicitar(usuariosRouter, "PATCH", `/usuarios/${id}`, edicion, "admin")).codigo).toBe(400);
    expect((await solicitar(usuariosRouter, "PUT", `/usuarios/${id}/contrasena`, { contrasena: "otra1234" }, "admin")).codigo).toBe(400);
    expect(dobles.obtener).not.toHaveBeenCalled();
    expect(dobles.editar).not.toHaveBeenCalled();
    expect(dobles.ponerClave).not.toHaveBeenCalled();
  });

  it("rechaza cuerpos inválidos antes del service", async () => {
    expect((await solicitar(usuariosRouter, "POST", "/usuarios", { ...alta, nombre_usuario: "MAYUSCULAS" }, "admin")).codigo).toBe(400);
    expect((await solicitar(usuariosRouter, "PATCH", "/usuarios/2", { ...edicion, activo: 1 }, "admin")).codigo).toBe(400);
    expect((await solicitar(usuariosRouter, "PUT", "/usuarios/2/contrasena", { contrasena: "corta" }, "admin")).codigo).toBe(400);
    expect(dobles.crear).not.toHaveBeenCalled();
    expect(dobles.editar).not.toHaveBeenCalled();
    expect(dobles.ponerClave).not.toHaveBeenCalled();
  });

  it("propaga 404 en lectura, edición y contraseña", async () => {
    dobles.obtener.mockRejectedValue(new ErrorNoEncontrado("Usuario no encontrado"));
    dobles.editar.mockRejectedValue(new ErrorNoEncontrado("Usuario no encontrado"));
    dobles.ponerClave.mockRejectedValue(new ErrorNoEncontrado("Usuario no encontrado"));
    const esperado = { codigo: 404, cuerpo: { error: "Usuario no encontrado" } };
    expect(await solicitar(usuariosRouter, "GET", "/usuarios/99", undefined, "admin")).toEqual(esperado);
    expect(await solicitar(usuariosRouter, "PATCH", "/usuarios/99", edicion, "admin")).toEqual(esperado);
    expect(await solicitar(usuariosRouter, "PUT", "/usuarios/99/contrasena", { contrasena: "otra1234" }, "admin")).toEqual(esperado);
  });

  it("propaga 409 en altas duplicadas y ediciones prohibidas", async () => {
    dobles.crear.mockRejectedValue(new ErrorConflicto("Ese nombre de usuario ya existe"));
    dobles.editar.mockRejectedValue(new ErrorConflicto("No puedes cambiar tu propio rol"));
    expect(await solicitar(usuariosRouter, "POST", "/usuarios", alta, "admin"))
      .toEqual({ codigo: 409, cuerpo: { error: "Ese nombre de usuario ya existe" } });
    expect(await solicitar(usuariosRouter, "PATCH", "/usuarios/7", edicion, "admin"))
      .toEqual({ codigo: 409, cuerpo: { error: "No puedes cambiar tu propio rol" } });
  });
});

describe("PUT /sesion/contrasena", () => {
  const datos = { actual: "demo1234", nueva: "otra1234" };

  it.each(esquemaRol.options)("%s puede cambiar su contraseña; el id y el token proceden de la sesión", async (rol) => {
    expect((await solicitar(sesionRouter, "PUT", "/sesion/contrasena", { ...datos, id: 99 }, rol)).codigo).toBe(204);
    expect(dobles.miClave).toHaveBeenCalledWith(7, "token-actual", datos);
  });

  it("rechaza sin sesión con 401", async () => {
    expect((await solicitar(sesionRouter, "PUT", "/sesion/contrasena", datos)).codigo).toBe(401);
    expect(dobles.miClave).not.toHaveBeenCalled();
  });

  it("rechaza una nueva corta con 400", async () => {
    expect((await solicitar(sesionRouter, "PUT", "/sesion/contrasena", { ...datos, nueva: "corta" }, "empleado")).codigo).toBe(400);
    expect(dobles.miClave).not.toHaveBeenCalled();
  });

  it("una actual incorrecta da 400 con el mensaje acordado", async () => {
    dobles.miClave.mockRejectedValue(new ErrorDatosInvalidos("La contraseña actual no es correcta"));
    expect(await solicitar(sesionRouter, "PUT", "/sesion/contrasena", datos, "empleado"))
      .toEqual({ codigo: 400, cuerpo: { error: "La contraseña actual no es correcta" } });
  });
});
