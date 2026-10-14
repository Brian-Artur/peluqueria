import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaRol, type DiaResuelto } from "@peluqueria/compartido";
import { obtenerSemanaHorarioRouter } from "./obtenerSemanaHorario";
import { solicitarEnMemoria } from "./solicitarEnMemoria.pruebas";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const { ejecutar } = vi.hoisted(() => ({ ejecutar: vi.fn() }));
vi.mock("../services/obtenerSemanaHorario", () => ({ obtenerSemanaHorario: ejecutar }));
afterEach(() => vi.resetAllMocks());
const datos: DiaResuelto[] = Array.from({ length: 7 }, (_, indice) => ({
  fecha: `2026-07-${String(7 + indice).padStart(2, "0")}`,
  tramos: [], origen: "general", motivo: null, temporada_nombre: null,
}));

describe("GET /horario/semana", () => {
  it("sin sesión da 401 sin ejecutar el caso de uso", async () => {
    expect((await solicitarEnMemoria(obtenerSemanaHorarioRouter, "GET", "/horario/semana?desde=2026-07-07", undefined)).codigo).toBe(401);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(esquemaRol.options)("%s obtiene 200", async (rol) => {
    ejecutar.mockResolvedValue(datos);
    expect(await solicitarEnMemoria(obtenerSemanaHorarioRouter, "GET", "/horario/semana?desde=2026-07-07", undefined, rol)).toEqual({ codigo: 200, cuerpo: datos });
    expect(ejecutar).toHaveBeenCalledExactlyOnceWith("2026-07-07");
  });
  it.each(["", "?desde=2026-02-29", "?desde=2026-7-7", "?desde=ayer", "?desde=2026-07-07&desde=2026-07-08"])("consulta inválida %s da 400", async (consulta) => {
    const url = "/horario/semana" + consulta;
    const respuesta = await solicitarEnMemoria(obtenerSemanaHorarioRouter, "GET", url, undefined, "admin");
    expect(respuesta.codigo).toBe(400);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each([[new ErrorConflicto("Conflicto de configuración"), 409], [new ErrorNoEncontrado("No encontrado"), 404]] as const)("traduce %s a %s", async (error, codigo) => {
    ejecutar.mockRejectedValue(error);
    expect(await solicitarEnMemoria(obtenerSemanaHorarioRouter, "GET", "/horario/semana?desde=2026-07-07", undefined, "encargado")).toEqual({ codigo, cuerpo: { error: error.message } });
  });
});
