import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaRol, type Rol } from "@peluqueria/compartido";
import { categoriasRouter } from "./categorias";
import { manejadorErrores } from "../middleware/errores";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({ listar: vi.fn(), crear: vi.fn(), editar: vi.fn() }));
vi.mock("../services/listarCategorias", () => ({ listarCategorias: dobles.listar }));
vi.mock("../services/crearCategoria", () => ({ crearCategoria: dobles.crear }));
vi.mock("../services/editarCategoria", () => ({ editarCategoria: dobles.editar }));
afterEach(() => vi.resetAllMocks());

type Respuesta = { codigo: number; cuerpo: unknown };

// Las peticiones se resuelven en memoria, sin sockets ni BD.
function solicitar(metodo: string, url: string, cuerpo?: unknown, rol?: Rol): Promise<Respuesta> {
  return new Promise((resolve, reject) => {
    let codigo = 200;
    const req = { method: metodo, url, body: cuerpo } as Request;
    const res = {
      locals: { usuario: rol ? { id: 7, rol } : undefined },
      status: (valor: number): Response => { codigo = valor; return res; },
      json: (datos: unknown): Response => { resolve({ codigo, cuerpo: datos }); return res; },
      send: (): Response => { resolve({ codigo, cuerpo: undefined }); return res; },
    } as unknown as Response;
    categoriasRouter(req, res, (error?: unknown) => {
      if (!error) { reject(new Error(`Ruta no encontrada: ${metodo} ${url}`)); return; }
      manejadorErrores(error, req, res, reject);
    });
  });
}

const datos = { nombre: "Pelo", activa: true };
const rutas: [string, string, unknown][] = [
  ["GET", "/categorias", undefined], ["POST", "/categorias", datos], ["PATCH", "/categorias/2", datos],
];

describe("permisos de categorías", () => {
  it.each(rutas)("sin sesión: %s %s da 401", async (metodo, url, cuerpo) => {
    expect((await solicitar(metodo, url, cuerpo)).codigo).toBe(401);
  });

  it.each(esquemaRol.options)("%s puede leer también las inactivas", async (rol) => {
    const lista = [{ id: 1, nombre: "Pelo", activa: false }];
    dobles.listar.mockResolvedValue(lista);
    expect(await solicitar("GET", "/categorias", undefined, rol)).toEqual({ codigo: 200, cuerpo: lista });
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
    expect(await solicitar("POST", "/categorias", datos, rol)).toEqual({ codigo: 201, cuerpo: { id: 2 } });
    expect(await solicitar("PATCH", "/categorias/2", { nombre: "Cabello", activa: false }, rol))
      .toEqual({ codigo: 204, cuerpo: undefined });
    expect(dobles.editar).toHaveBeenCalledWith(2, { nombre: "Cabello", activa: false });
  });
});

describe("validación y errores de categorías", () => {
  it.each(["no-numero", "0", "-1", "1.5"])("rechaza el id %s", async (id) => {
    expect((await solicitar("PATCH", `/categorias/${id}`, datos, "admin")).codigo).toBe(400);
    expect(dobles.editar).not.toHaveBeenCalled();
  });

  it.each([{ nombre: " " }, { nombre: "a".repeat(61) }, { activa: "true" }])(
    "rechaza los datos %j antes del service", async (cambio) => {
      expect((await solicitar("POST", "/categorias", { ...datos, ...cambio }, "admin")).codigo).toBe(400);
      expect((await solicitar("PATCH", "/categorias/2", { ...datos, ...cambio }, "admin")).codigo).toBe(400);
      expect(dobles.crear).not.toHaveBeenCalled();
      expect(dobles.editar).not.toHaveBeenCalled();
    }
  );

  it("propaga 404 al editar una categoría inexistente", async () => {
    dobles.editar.mockRejectedValue(new ErrorNoEncontrado("Categoría no encontrada"));
    expect(await solicitar("PATCH", "/categorias/99", datos, "admin"))
      .toEqual({ codigo: 404, cuerpo: { error: "Categoría no encontrada" } });
  });

  it("propaga 409 por nombres duplicados en altas y renombrados", async () => {
    const mensaje = "Ya existe una categoría con ese nombre";
    dobles.crear.mockRejectedValue(new ErrorConflicto(mensaje));
    dobles.editar.mockRejectedValue(new ErrorConflicto(mensaje));
    const esperado = { codigo: 409, cuerpo: { error: mensaje } };
    expect(await solicitar("POST", "/categorias", datos, "admin")).toEqual(esperado);
    expect(await solicitar("PATCH", "/categorias/2", datos, "admin")).toEqual(esperado);
  });
});
