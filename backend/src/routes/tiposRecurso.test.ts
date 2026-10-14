import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaRol, type Rol } from "@peluqueria/compartido";
import { tiposRecursoRouter } from "./tiposRecurso";
import { manejadorErrores } from "../middleware/errores";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({ listar: vi.fn(), crear: vi.fn(), editar: vi.fn() }));
vi.mock("../services/listarTiposRecurso", () => ({ listarTiposRecurso: dobles.listar }));
vi.mock("../services/crearTipoRecurso", () => ({ crearTipoRecurso: dobles.crear }));
vi.mock("../services/editarTipoRecurso", () => ({ editarTipoRecurso: dobles.editar }));
afterEach(() => vi.resetAllMocks());

type Respuesta = { codigo: number; cuerpo: unknown };

// Router y middleware reales en memoria: sin arrancar servidores ni cargar la BD.
function solicitar(metodo: string, url: string, cuerpo?: unknown, rol?: Rol): Promise<Respuesta> {
  return new Promise((resolve, reject) => {
    let codigo = 200;
    const parametros = new URL(url, "http://127.0.0.1").searchParams;
    const req = { method: metodo, url, body: cuerpo, query: Object.fromEntries(parametros) } as Request;
    const res = {
      locals: { usuario: rol ? { id: 7, rol } : undefined },
      status: (valor: number): Response => { codigo = valor; return res; },
      json: (datos: unknown): Response => { resolve({ codigo, cuerpo: datos }); return res; },
      send: (): Response => { resolve({ codigo, cuerpo: undefined }); return res; },
    } as unknown as Response;
    tiposRecursoRouter(req, res, (error?: unknown) => {
      if (!error) { reject(new Error(`Ruta no encontrada: ${metodo} ${url}`)); return; }
      manejadorErrores(error, req, res, reject);
    });
  });
}

const datos = { nombre: "Butaca", activo: true };
const rutas: [string, string, unknown][] = [
  ["GET", "/tipos-recurso", undefined],
  ["POST", "/tipos-recurso", datos], ["PATCH", "/tipos-recurso/2", datos],
];

describe("permisos de tipos-recurso", () => {
  it.each(rutas)("sin sesión: %s %s da 401", async (metodo, url, cuerpo) => {
    expect((await solicitar(metodo, url, cuerpo)).codigo).toBe(401);
    expect(dobles.listar).not.toHaveBeenCalled();
    expect(dobles.crear).not.toHaveBeenCalled();
    expect(dobles.editar).not.toHaveBeenCalled();
  });

  it.each(esquemaRol.options)("%s puede listar e incluir inactivos", async (rol) => {
    dobles.listar.mockResolvedValue([]);
    expect(await solicitar("GET", "/tipos-recurso", undefined, rol)).toEqual({ codigo: 200, cuerpo: [] });
    expect(dobles.listar).toHaveBeenLastCalledWith(false);
    expect((await solicitar("GET", "/tipos-recurso?incluirInactivos=true", undefined, rol)).codigo).toBe(200);
    expect(dobles.listar).toHaveBeenLastCalledWith(true);
    await solicitar("GET", "/tipos-recurso?incluirInactivos=false", undefined, rol);
    expect(dobles.listar).toHaveBeenLastCalledWith(false);
  });

  for (const rol of ["recepcion", "empleado"] as const) {
    it.each(rutas.slice(1))(`${rol}: %s %s da 403`, async (metodo, url, cuerpo) => {
      expect((await solicitar(metodo, url, cuerpo, rol)).codigo).toBe(403);
      expect(dobles.crear).not.toHaveBeenCalled();
      expect(dobles.editar).not.toHaveBeenCalled();
    });
  }

  it.each(["admin", "encargado"] as const)("%s crea con 201 y edita con 204", async (rol) => {
    dobles.crear.mockResolvedValue(2);
    expect(await solicitar("POST", "/tipos-recurso", datos, rol)).toEqual({ codigo: 201, cuerpo: { id: 2 } });
    expect(await solicitar("PATCH", "/tipos-recurso/2", datos, rol)).toEqual({ codigo: 204, cuerpo: undefined });
    expect(dobles.crear).toHaveBeenCalledWith(datos);
    expect(dobles.editar).toHaveBeenCalledWith(2, datos);
  });
});

describe("validación y errores de tipos-recurso", () => {
  it("rechaza un filtro ambiguo con 400", async () => {
    expect((await solicitar("GET", "/tipos-recurso?incluirInactivos=1", undefined, "admin")).codigo).toBe(400);
    expect(dobles.listar).not.toHaveBeenCalled();
  });

  it.each(["0", "-1", "abc", "1.5"])("rechaza id %s con 400", async (id) => {
    expect((await solicitar("PATCH", `/tipos-recurso/${id}`, datos, "admin")).codigo).toBe(400);
    expect(dobles.editar).not.toHaveBeenCalled();
  });

  it.each([{ nombre: " " }, { nombre: "a".repeat(61) }, { activo: 1 }])("rechaza datos %j con 400", async (cambio) => {
    for (const [metodo, url] of rutas.slice(1)) {
      expect((await solicitar(metodo, url, { ...datos, ...cambio }, "admin")).codigo).toBe(400);
    }
    expect(dobles.crear).not.toHaveBeenCalled();
    expect(dobles.editar).not.toHaveBeenCalled();
  });

  it("propaga conflictos con 409 y entidades ausentes con 404", async () => {
    for (const [error, codigo] of [
      [new ErrorConflicto("Nombre duplicado o tipo inactivo"), 409],
      [new ErrorNoEncontrado("No encontrado"), 404],
    ] as const) {
      dobles.crear.mockRejectedValue(error);
      dobles.editar.mockRejectedValue(error);
      for (const [metodo, url] of rutas.slice(1)) {
        expect(await solicitar(metodo, url, datos, "encargado")).toEqual({ codigo, cuerpo: { error: error.message } });
      }
    }
  });
});
