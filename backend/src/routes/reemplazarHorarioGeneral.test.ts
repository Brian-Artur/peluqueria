import { afterEach, describe, expect, it, vi } from "vitest";
import { reemplazarHorarioGeneralRouter } from "./reemplazarHorarioGeneral";
import { solicitarEnMemoria } from "./solicitarEnMemoria.pruebas";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const { ejecutar } = vi.hoisted(() => ({ ejecutar: vi.fn() }));
vi.mock("../services/reemplazarHorarioGeneral", () => ({ reemplazarHorarioGeneral: ejecutar }));
afterEach(() => vi.resetAllMocks());
const datos = [{ dia_semana: 2, tramos: [{ abre: "09:30", cierra: "14:00" }, { abre: "16:00", cierra: "20:00" }] }];

describe("PUT /horario/general", () => {
  it("sin sesión da 401 sin ejecutar el caso de uso", async () => {
    expect((await solicitarEnMemoria(reemplazarHorarioGeneralRouter, "PUT", "/horario/general", datos)).codigo).toBe(401);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(["recepcion", "empleado"] as const)("%s recibe 403 sin ejecutar el caso de uso", async (rol) => {
    expect((await solicitarEnMemoria(reemplazarHorarioGeneralRouter, "PUT", "/horario/general", datos, rol)).codigo).toBe(403);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each(["admin", "encargado"] as const)("%s obtiene 204", async (rol) => {
    ejecutar.mockResolvedValue(undefined);
    expect(await solicitarEnMemoria(reemplazarHorarioGeneralRouter, "PUT", "/horario/general", datos, rol)).toEqual({ codigo: 204, cuerpo: undefined });
    expect(ejecutar).toHaveBeenCalledExactlyOnceWith(datos);
  });
  it("un cuerpo inválido da 400 antes de llamar al servicio", async () => {
    expect((await solicitarEnMemoria(reemplazarHorarioGeneralRouter, "PUT", "/horario/general", null, "admin")).codigo).toBe(400);
    expect(ejecutar).not.toHaveBeenCalled();
  });
  it.each([[new ErrorConflicto("Conflicto de configuración"), 409], [new ErrorNoEncontrado("No encontrado"), 404]] as const)("traduce %s a %s", async (error, codigo) => {
    ejecutar.mockRejectedValue(error);
    expect(await solicitarEnMemoria(reemplazarHorarioGeneralRouter, "PUT", "/horario/general", datos, "encargado")).toEqual({ codigo, cuerpo: { error: error.message } });
  });
});
