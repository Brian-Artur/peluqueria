import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { obtenerHorario } from "./obtenerHorario";

const dobles = vi.hoisted(() => ({
  conectar: vi.fn(), general: vi.fn(), temporadas: vi.fn(), excepciones: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/consultarHorarioGeneral", () => ({ consultarHorarioGeneral: dobles.general }));
vi.mock("../repositories/consultarTemporadas", () => ({ consultarTemporadas: dobles.temporadas }));
vi.mock("../repositories/consultarExcepciones", () => ({ consultarExcepciones: dobles.excepciones }));
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.general.mockResolvedValue([{ dia_semana: 2, tramos: [{ abre: "09:00", cierra: "20:00" }] }]);
  dobles.temporadas.mockResolvedValue([]);
  dobles.excepciones.mockResolvedValue([]);
});
afterEach(() => vi.resetAllMocks());

describe("obtener horario completo", () => {
  it("lee general, temporadas y excepciones en un mismo snapshot", async () => {
    expect(await obtenerHorario()).toEqual({ general: [{ dia_semana: 2, tramos: [{ abre: "09:00", cierra: "20:00" }] }], temporadas: [], excepciones: [] });
    expect(dobles.conexion.beginTransaction.mock.invocationCallOrder[0]).toBeLessThan(dobles.general.mock.invocationCallOrder[0]!);
    for (const lectura of [dobles.general, dobles.temporadas, dobles.excepciones]) {
      expect(lectura).toHaveBeenCalledExactlyOnceWith(dobles.conexion);
    }
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
  it("revierte y libera la conexión si falla una lectura", async () => {
    const error = new Error("Fallo de lectura");
    dobles.temporadas.mockRejectedValue(error);
    await expect(obtenerHorario()).rejects.toBe(error);
    expect(dobles.excepciones).not.toHaveBeenCalled();
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});
