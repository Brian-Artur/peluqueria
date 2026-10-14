import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Rol } from "@peluqueria/compartido";
import { empleadosRouter } from "./empleados";
import { manejadorErrores } from "../middleware/errores";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  listar: vi.fn(), obtener: vi.fn(), crear: vi.fn(), editar: vi.fn(), contrato: vi.fn(), baja: vi.fn(), competencias: vi.fn(), resumen: vi.fn(),
  tiempos: vi.fn(), editarTiempo: vi.fn(), historialTiempo: vi.fn(),
}));
vi.mock("../services/listarEmpleados", () => ({ listarEmpleados: dobles.listar }));
vi.mock("../services/obtenerEmpleado", () => ({ obtenerEmpleado: dobles.obtener }));
vi.mock("../services/crearEmpleado", () => ({ crearEmpleado: dobles.crear }));
vi.mock("../services/editarEmpleado", () => ({ editarEmpleado: dobles.editar }));
vi.mock("../services/nuevoContratoEmpleado", () => ({ nuevoContratoEmpleado: dobles.contrato }));
vi.mock("../services/darBajaEmpleado", () => ({ darBajaEmpleado: dobles.baja }));
vi.mock("../services/reemplazarCompetencias", () => ({ reemplazarCompetencias: dobles.competencias }));
vi.mock("../services/listarCompetencias", () => ({ listarCompetencias: dobles.resumen }));
vi.mock("../services/listarTiemposEmpleado", () => ({ listarTiemposEmpleado: dobles.tiempos }));
vi.mock("../services/editarTiempoEmpleado", () => ({ editarTiempoEmpleado: dobles.editarTiempo }));
vi.mock("../services/listarHistorialTiempo", () => ({ listarHistorialTiempo: dobles.historialTiempo }));
afterEach(() => vi.resetAllMocks());

type Respuesta = { codigo: number; cuerpo: unknown };

// Router y middleware reales en memoria: no se abre ningún puerto ni conexión a la BD.
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
    empleadosRouter(req, res, (error?: unknown) => {
      if (!error) { reject(new Error(`Ruta no encontrada: ${metodo} ${url}`)); return; }
      manejadorErrores(error, req, res, reject);
    });
  });
}

const datos = { nombre: "Ana", telefono: null, email: null };
const contrato = { tipo: "plantilla", desde: "2026-10-14", tutor_id: null, empresa: null };
const alta = { ...datos, contrato };
const competencias = [{ servicio_id: 1, nivel: "experto" }];
const lecturas: [string, string, unknown][] = [
  ["GET", "/empleados", undefined], ["GET", "/empleados/1", undefined], ["GET", "/competencias", undefined],
];
const escrituras: [string, string, unknown][] = [
  ["POST", "/empleados", alta], ["PATCH", "/empleados/1", datos],
  ["POST", "/empleados/1/contratos", contrato], ["POST", "/empleados/1/baja", { fecha: "2026-10-14" }],
  ["PUT", "/empleados/1/competencias", competencias],
];
const datosTiempo = { duracion_min: 45, margen_min: 10 };
const rutasTiempo: [string, string, unknown][] = [
  ["GET", "/empleados/1/tiempos", undefined],
  ["GET", "/empleados/1/tiempos/historial", undefined],
  ["PUT", "/empleados/1/tiempos/2", datosTiempo],
];
const rutas = [...lecturas, ...escrituras, ...rutasTiempo];

describe("permisos de todas las rutas de empleados y competencias", () => {
  it.each(rutas)("sin sesión: %s %s da 401", async (metodo, url, cuerpo) => {
    expect((await solicitar(metodo, url, cuerpo)).codigo).toBe(401);
  });

  it.each(rutas)("empleado: %s %s da 403", async (metodo, url, cuerpo) => {
    expect((await solicitar(metodo, url, cuerpo, "empleado")).codigo).toBe(403);
  });

  it.each(escrituras)("recepción: %s %s da 403", async (metodo, url, cuerpo) => {
    expect((await solicitar(metodo, url, cuerpo, "recepcion")).codigo).toBe(403);
  });

  for (const rol of ["admin", "encargado", "recepcion"] as const) {
    it.each(lecturas)(`${rol}: %s %s da 200`, async (metodo, url, cuerpo) => {
      dobles.listar.mockResolvedValue([]);
      dobles.obtener.mockResolvedValue({ id: 1 });
      dobles.resumen.mockResolvedValue([]);
      expect((await solicitar(metodo, url, cuerpo, rol)).codigo).toBe(200);
    });
  }

  it.each(["admin", "encargado"] as const)("%s puede escribir con 201/204", async (rol) => {
    dobles.crear.mockResolvedValue(1);
    dobles.contrato.mockResolvedValue(2);
    expect(await solicitar("POST", "/empleados", alta, rol)).toEqual({ codigo: 201, cuerpo: { id: 1 } });
    expect(await solicitar("POST", "/empleados/1/contratos", contrato, rol)).toEqual({ codigo: 201, cuerpo: { id: 2 } });
    expect((await solicitar("PATCH", "/empleados/1", datos, rol)).codigo).toBe(204);
    expect((await solicitar("POST", "/empleados/1/baja", { fecha: "2026-10-14" }, rol)).codigo).toBe(204);
    expect((await solicitar("PUT", "/empleados/1/competencias", competencias, rol)).codigo).toBe(204);
    expect(dobles.crear).toHaveBeenCalledWith(alta);
    expect(dobles.editar).toHaveBeenCalledWith(1, datos);
    expect(dobles.contrato).toHaveBeenCalledWith(1, contrato);
    expect(dobles.baja).toHaveBeenCalledWith(1, { fecha: "2026-10-14" });
    expect(dobles.competencias).toHaveBeenCalledWith(1, competencias);
  });
});

describe("rutas de tiempos e historial", () => {
  it.each(rutasTiempo)("recepción: %s %s da 403", async (metodo, url, cuerpo) => {
    expect((await solicitar(metodo, url, cuerpo, "recepcion")).codigo).toBe(403);
    expect(dobles.tiempos).not.toHaveBeenCalled();
    expect(dobles.editarTiempo).not.toHaveBeenCalled();
    expect(dobles.historialTiempo).not.toHaveBeenCalled();
  });

  it.each(["admin", "encargado"] as const)("%s consulta con 200 y edita con 204, pasando su usuario", async (rol) => {
    const tiempos = [{ servicio_id: 2, duracion_agendada: 60 }];
    const historial = [{ campo: "duracion", valor_anterior: null, valor_nuevo: 45 }];
    dobles.tiempos.mockResolvedValue(tiempos);
    dobles.historialTiempo.mockResolvedValue(historial);
    expect(await solicitar("GET", "/empleados/1/tiempos", undefined, rol)).toEqual({ codigo: 200, cuerpo: tiempos });
    expect(await solicitar("GET", "/empleados/1/tiempos/historial", undefined, rol)).toEqual({ codigo: 200, cuerpo: historial });
    expect(await solicitar("PUT", "/empleados/1/tiempos/2", { ...datosTiempo, usuario_id: 99 }, rol)).toEqual({ codigo: 204, cuerpo: undefined });
    expect(dobles.tiempos).toHaveBeenCalledWith(1);
    expect(dobles.historialTiempo).toHaveBeenCalledWith(1);
    expect(dobles.editarTiempo).toHaveBeenCalledWith(1, 2, datosTiempo, 7);
  });

  it("admite volver a la duración heredada", async () => {
    const datos = { duracion_min: null, margen_min: 0 };
    expect((await solicitar("PUT", "/empleados/1/tiempos/2", datos, "admin")).codigo).toBe(204);
    expect(dobles.editarTiempo).toHaveBeenCalledWith(1, 2, datos, 7);
  });

  it.each(["0", "-1", "1.5", "abc"])("rechaza id o servicioId %s con 400", async (id) => {
    for (const [metodo, url, cuerpo] of rutasTiempo) {
      expect((await solicitar(metodo, url.replace("/1", `/${id}`), cuerpo, "admin")).codigo).toBe(400);
    }
    expect((await solicitar("PUT", `/empleados/1/tiempos/${id}`, datosTiempo, "admin")).codigo).toBe(400);
    expect(dobles.tiempos).not.toHaveBeenCalled();
    expect(dobles.historialTiempo).not.toHaveBeenCalled();
    expect(dobles.editarTiempo).not.toHaveBeenCalled();
  });

  it.each([null, {}, { duracion_min: 0, margen_min: 0 }, { duracion_min: 31, margen_min: 0 },
    { duracion_min: 605, margen_min: 0 }, { duracion_min: null, margen_min: 1 },
    { duracion_min: null, margen_min: 65 }, { duracion_min: "45", margen_min: 0 },
  ])("rechaza datos %j antes del servicio", async (datos) => {
    expect((await solicitar("PUT", "/empleados/1/tiempos/2", datos, "admin")).codigo).toBe(400);
    expect(dobles.editarTiempo).not.toHaveBeenCalled();
  });

  it.each(rutasTiempo)("propaga 404: %s %s", async (metodo, url, cuerpo) => {
    for (const doble of [dobles.tiempos, dobles.historialTiempo, dobles.editarTiempo]) {
      doble.mockRejectedValue(new ErrorNoEncontrado("Empleado no encontrado"));
    }
    expect(await solicitar(metodo, url, cuerpo, "admin")).toEqual({ codigo: 404, cuerpo: { error: "Empleado no encontrado" } });
  });

  it("devuelve 404 si no existe la competencia", async () => {
    dobles.editarTiempo.mockRejectedValue(new ErrorNoEncontrado("Competencia no encontrada"));
    expect(await solicitar("PUT", "/empleados/1/tiempos/2", datosTiempo, "admin")).toEqual({ codigo: 404, cuerpo: { error: "Competencia no encontrada" } });
  });
});

describe("validación y respuestas de empleados", () => {
  it("envía el filtro de activos correctamente y rechaza valores ambiguos", async () => {
    dobles.listar.mockResolvedValue([]);
    await solicitar("GET", "/empleados", undefined, "admin");
    expect(dobles.listar).toHaveBeenLastCalledWith(false);
    await solicitar("GET", "/empleados?incluirInactivos=false", undefined, "admin");
    expect(dobles.listar).toHaveBeenLastCalledWith(false);
    await solicitar("GET", "/empleados?incluirInactivos=true", undefined, "recepcion");
    expect(dobles.listar).toHaveBeenLastCalledWith(true);
    expect((await solicitar("GET", "/empleados?incluirInactivos=1", undefined, "admin")).codigo).toBe(400);
    expect(dobles.listar).toHaveBeenCalledTimes(3);
  });

  it.each(["0", "-1", "1.5", "abc"])("rechaza id %s con 400 en todas las rutas con id", async (id) => {
    const rutasConId = [lecturas[1], ...escrituras.slice(1)];
    for (const [metodo, url, cuerpo] of rutasConId) {
      expect((await solicitar(metodo, url.replace("/1", `/${id}`), cuerpo, "admin")).codigo).toBe(400);
    }
    expect(dobles.obtener).not.toHaveBeenCalled();
    expect(dobles.editar).not.toHaveBeenCalled();
    expect(dobles.contrato).not.toHaveBeenCalled();
    expect(dobles.baja).not.toHaveBeenCalled();
    expect(dobles.competencias).not.toHaveBeenCalled();
  });

  it.each([
    ["POST", "/empleados", datos],
    ["PATCH", "/empleados/1", { ...datos, telefono: "600111222" }],
    ["POST", "/empleados/1/contratos", { ...contrato, tipo: "externo" }],
    ["POST", "/empleados/1/contratos", { ...contrato, tutor_id: 2 }],
    ["POST", "/empleados/1/baja", { fecha: "2026-02-30" }],
    ["PUT", "/empleados/1/competencias", [...competencias, ...competencias]],
  ])("datos inválidos: %s %s da 400", async (metodo, url, cuerpo) => {
    expect((await solicitar(metodo as string, url as string, cuerpo, "admin")).codigo).toBe(400);
    for (const doble of Object.values(dobles)) expect(doble).not.toHaveBeenCalled();
  });

  it("devuelve la lista, la ficha y el cuadro de competencias", async () => {
    const ficha = { id: 1, nombre: "Ana" };
    const cuadro = [{ empleado_id: 1, ...competencias[0] }];
    dobles.listar.mockResolvedValue([ficha]);
    dobles.obtener.mockResolvedValue(ficha);
    dobles.resumen.mockResolvedValue(cuadro);
    expect(await solicitar("GET", "/empleados", undefined, "admin")).toEqual({ codigo: 200, cuerpo: [ficha] });
    expect(await solicitar("GET", "/empleados/1", undefined, "admin")).toEqual({ codigo: 200, cuerpo: ficha });
    expect(await solicitar("GET", "/competencias", undefined, "admin")).toEqual({ codigo: 200, cuerpo: cuadro });
  });

  it("propaga 404 de ficha y todas las escrituras sobre un empleado inexistente", async () => {
    for (const doble of [dobles.obtener, dobles.editar, dobles.contrato, dobles.baja, dobles.competencias]) {
      doble.mockRejectedValue(new ErrorNoEncontrado("Empleado no encontrado"));
    }
    for (const [metodo, url, cuerpo] of [lecturas[1], ...escrituras.slice(1)]) {
      expect(await solicitar(metodo, url, cuerpo, "admin")).toEqual({ codigo: 404, cuerpo: { error: "Empleado no encontrado" } });
    }
  });

  it.each(escrituras)("propaga conflictos de negocio: %s %s da 409", async (metodo, url, cuerpo) => {
    const mensaje = "Conflicto de negocio";
    for (const doble of [dobles.crear, dobles.editar, dobles.contrato, dobles.baja, dobles.competencias]) {
      doble.mockRejectedValue(new ErrorConflicto(mensaje));
    }
    expect(await solicitar(metodo, url, cuerpo, "admin")).toEqual({ codigo: 409, cuerpo: { error: mensaje } });
  });
});
