import { afterEach, describe, expect, it, vi } from "vitest";
import { obtenerSemanaHorario } from "./obtenerSemanaHorario";

const { obtener } = vi.hoisted(() => ({ obtener: vi.fn() }));
vi.mock("./obtenerHorario", () => ({ obtenerHorario: obtener }));
afterEach(() => vi.resetAllMocks());

describe("obtener semana de horario", () => {
  it("resuelve siete días con la configuración consultada", async () => {
    obtener.mockResolvedValue({
      general: [{ dia_semana: 2, tramos: [{ abre: "09:00", cierra: "20:00" }] }], temporadas: [],
      excepciones: [{ id: 1, fecha: "2026-07-12", cerrado: false, motivo: "Bodas", tramos: [{ abre: "09:00", cierra: "14:00" }] }],
    });
    const semana = await obtenerSemanaHorario("2026-07-07");
    expect(semana).toHaveLength(7);
    expect(semana[0].tramos).toEqual([{ abre: "09:00", cierra: "20:00" }]);
    expect(semana[5]).toEqual({ fecha: "2026-07-12", tramos: [{ abre: "09:00", cierra: "14:00" }], origen: "excepcion", motivo: "Bodas", temporada_nombre: null });
    expect(obtener).toHaveBeenCalledOnce();
  });
});
