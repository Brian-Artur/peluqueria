import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaRol, type Rol } from "@peluqueria/compartido";
import { serviciosRouter } from "./servicios";
import { manejadorErrores } from "../middleware/errores";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({ listar: vi.fn(), obtener: vi.fn(), crear: vi.fn(), editar: vi.fn() }));
vi.mock("../services/listarServicios", () => ({ listarServicios: dobles.listar }));
vi.mock("../services/obtenerServicio", () => ({ obtenerServicio: dobles.obtener }));
vi.mock("../services/crearServicio", () => ({ crearServicio: dobles.crear }));
vi.mock("../services/editarServicio", () => ({ editarServicio: dobles.editar }));
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
    serviciosRouter(req, res, (error?: unknown) => {
      if (!error) { reject(new Error(`Ruta no encontrada: ${metodo} ${url}`)); return; }
      manejadorErrores(error, req, res, reject);
    });
  });
}

const datos = { nombre: "Corte", categoria_id: null, duracion_min: 30, precio: "15.00", activo: true };
const servicio = { ...datos, id: 2, categoria_nombre: null };
const rutas: [string, string, unknown][] = [
  ["GET", "/servicios", undefined], ["GET", "/servicios/2", undefined],
  ["POST", "/servicios", datos], ["PATCH", "/servicios/2", datos],
];

describe("permisos en todas las rutas de servicios", () => {
  it.each(rutas)("sin sesión: %s %s da 401", async (metodo, url, cuerpo) => {
    expect((await solicitar(metodo, url, cuerpo)).codigo).toBe(401);
  });

  it.each(esquemaRol.options)("%s puede consultar lista y ficha", async (rol) => {
    dobles.listar.mockResolvedValue([servicio]);
    dobles.obtener.mockResolvedValue(servicio);
    expect((await solicitar("GET", "/servicios", undefined, rol)).codigo).toBe(200);
    expect((await solicitar("GET", "/servicios/2", undefined, rol)).codigo).toBe(200);
    expect((await solicitar("GET", "/servicios?incluirInactivos=true", undefined, rol)).codigo).toBe(200);
  });

  for (const rol of ["recepcion", "empleado"] as const) {
    it.each(rutas.slice(2))(`${rol}: %s %s da 403`, async (metodo, url, cuerpo) => {
      expect((await solicitar(metodo, url, cuerpo, rol)).codigo).toBe(403);
      expect(dobles.crear).not.toHaveBeenCalled();
      expect(dobles.editar).not.toHaveBeenCalled();
    });
  }

  it.each(["admin", "encargado"] as const)("%s crea con 201 y edita con 204", async (rol) => {
    dobles.crear.mockResolvedValue(2);
    expect(await solicitar("POST", "/servicios", datos, rol)).toEqual({ codigo: 201, cuerpo: { id: 2 } });
    expect(await solicitar("PATCH", "/servicios/2", datos, rol)).toEqual({ codigo: 204, cuerpo: undefined });
    expect(dobles.crear).toHaveBeenCalledWith(datos);
    expect(dobles.editar).toHaveBeenCalledWith(2, datos);
  });
});

describe("validación y respuestas de servicios", () => {
  it("la agenda pide solo activos y la gestión puede incluir inactivos", async () => {
    dobles.listar.mockResolvedValue([servicio]);
    expect(await solicitar("GET", "/servicios", undefined, "empleado")).toEqual({ codigo: 200, cuerpo: [servicio] });
    expect(dobles.listar).toHaveBeenLastCalledWith(false);
    await solicitar("GET", "/servicios?incluirInactivos=false", undefined, "admin");
    expect(dobles.listar).toHaveBeenLastCalledWith(false);
    await solicitar("GET", "/servicios?incluirInactivos=true", undefined, "admin");
    expect(dobles.listar).toHaveBeenLastCalledWith(true);
  });

  it("rechaza un filtro ambiguo con 400", async () => {
    expect((await solicitar("GET", "/servicios?incluirInactivos=1", undefined, "admin")).codigo).toBe(400);
    expect(dobles.listar).not.toHaveBeenCalled();
  });

  it.each(["no-numero", "0", "-1", "1.5"])("rechaza el id %s con 400", async (id) => {
    expect((await solicitar("GET", `/servicios/${id}`, undefined, "admin")).codigo).toBe(400);
    expect((await solicitar("PATCH", `/servicios/${id}`, datos, "admin")).codigo).toBe(400);
    expect(dobles.obtener).not.toHaveBeenCalled();
    expect(dobles.editar).not.toHaveBeenCalled();
  });

  it.each([{ duracion_min: 31 }, { precio: "-1" }, { activo: 1 }, { nombre: " " }])(
    "rechaza los datos %j antes del service", async (cambio) => {
      expect((await solicitar("POST", "/servicios", { ...datos, ...cambio }, "admin")).codigo).toBe(400);
      expect((await solicitar("PATCH", "/servicios/2", { ...datos, ...cambio }, "admin")).codigo).toBe(400);
      expect(dobles.crear).not.toHaveBeenCalled();
      expect(dobles.editar).not.toHaveBeenCalled();
    }
  );

  it("propaga los 404 del service", async () => {
    dobles.obtener.mockRejectedValue(new ErrorNoEncontrado("Servicio no encontrado"));
    dobles.editar.mockRejectedValue(new ErrorNoEncontrado("Servicio no encontrado"));
    dobles.crear.mockRejectedValue(new ErrorNoEncontrado("Categoría no encontrada"));
    expect((await solicitar("GET", "/servicios/99", undefined, "admin")).codigo).toBe(404);
    expect((await solicitar("PATCH", "/servicios/99", datos, "admin")).codigo).toBe(404);
    expect((await solicitar("POST", "/servicios", { ...datos, categoria_id: 99 }, "admin")).codigo).toBe(404);
  });

  it("propaga 409 al asignar una categoría inactiva", async () => {
    const mensaje = "No se puede asignar una categoría inactiva";
    dobles.crear.mockRejectedValue(new ErrorConflicto(mensaje));
    dobles.editar.mockRejectedValue(new ErrorConflicto(mensaje));
    const esperado = { codigo: 409, cuerpo: { error: mensaje } };
    expect(await solicitar("POST", "/servicios", datos, "encargado")).toEqual(esperado);
    expect(await solicitar("PATCH", "/servicios/2", datos, "encargado")).toEqual(esperado);
  });
});
