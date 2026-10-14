import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaRol, type Rol } from "@peluqueria/compartido";
import { recursosRouter } from "./recursos";
import { manejadorErrores } from "../middleware/errores";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({ listar: vi.fn(), crear: vi.fn(), editar: vi.fn() }));
vi.mock("../services/listarRecursos", () => ({ listarRecursos: dobles.listar }));
vi.mock("../services/crearRecurso", () => ({ crearRecurso: dobles.crear }));
vi.mock("../services/editarRecurso", () => ({ editarRecurso: dobles.editar }));
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
    recursosRouter(req, res, (error?: unknown) => {
      if (!error) { reject(new Error(`Ruta no encontrada: ${metodo} ${url}`)); return; }
      manejadorErrores(error, req, res, reject);
    });
  });
}

const datos = { nombre: "Butaca 1", tipo_recurso_id: 1, fuera_de_servicio: false, motivo: null, activo: true };
const rutas: [string, string, unknown][] = [
  ["GET", "/recursos", undefined],
  ["POST", "/recursos", datos], ["PATCH", "/recursos/2", datos],
];

describe("permisos de recursos", () => {
  it.each(rutas)("sin sesión: %s %s da 401", async (metodo, url, cuerpo) => {
    expect((await solicitar(metodo, url, cuerpo)).codigo).toBe(401);
    expect(dobles.listar).not.toHaveBeenCalled();
    expect(dobles.crear).not.toHaveBeenCalled();
    expect(dobles.editar).not.toHaveBeenCalled();
  });

  it.each(esquemaRol.options)("%s puede listar e incluir inactivos", async (rol) => {
    dobles.listar.mockResolvedValue([]);
    expect(await solicitar("GET", "/recursos", undefined, rol)).toEqual({ codigo: 200, cuerpo: [] });
    expect(dobles.listar).toHaveBeenLastCalledWith(false);
    expect((await solicitar("GET", "/recursos?incluirInactivos=true", undefined, rol)).codigo).toBe(200);
    expect(dobles.listar).toHaveBeenLastCalledWith(true);
    await solicitar("GET", "/recursos?incluirInactivos=false", undefined, rol);
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
    expect(await solicitar("POST", "/recursos", datos, rol)).toEqual({ codigo: 201, cuerpo: { id: 2 } });
    expect(await solicitar("PATCH", "/recursos/2", datos, rol)).toEqual({ codigo: 204, cuerpo: undefined });
    expect(dobles.crear).toHaveBeenCalledWith(datos);
    expect(dobles.editar).toHaveBeenCalledWith(2, datos);
  });
});

describe("validación y errores de recursos", () => {
  it("rechaza un filtro ambiguo con 400", async () => {
    expect((await solicitar("GET", "/recursos?incluirInactivos=1", undefined, "admin")).codigo).toBe(400);
    expect(dobles.listar).not.toHaveBeenCalled();
  });

  it.each(["0", "-1", "abc", "1.5"])("rechaza id %s con 400", async (id) => {
    expect((await solicitar("PATCH", `/recursos/${id}`, datos, "admin")).codigo).toBe(400);
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

  it("exige un motivo al marcar fuera de servicio y normaliza el vacío", async () => {
    expect((await solicitar("POST", "/recursos", { ...datos, fuera_de_servicio: true, motivo: " " }, "admin")).codigo).toBe(400);
    expect(dobles.crear).not.toHaveBeenCalled();
    dobles.crear.mockResolvedValue(2);
    expect((await solicitar("POST", "/recursos", { ...datos, motivo: " " }, "admin")).codigo).toBe(201);
    expect(dobles.crear).toHaveBeenCalledWith(datos);
  });
});
