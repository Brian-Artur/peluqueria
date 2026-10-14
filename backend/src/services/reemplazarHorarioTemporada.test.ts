import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reemplazarHorarioTemporada } from "./reemplazarHorarioTemporada";
import { ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  conectar: vi.fn(), bloquear: vi.fn(), consultar: vi.fn(), escribir: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/bloquearConfiguracionHorario", () => ({ bloquearConfiguracionHorario: dobles.bloquear }));
vi.mock("../repositories/consultarTemporadas", () => ({ consultarTemporadas: dobles.consultar }));
vi.mock("../repositories/sustituirHorarioTemporada", () => ({ sustituirHorarioTemporada: dobles.escribir }));
const datos = [{ dia_semana: 2, tramos: [{ abre: "09:00", cierra: "14:00" }] }];
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.bloquear.mockResolvedValue(true);
  dobles.consultar.mockResolvedValue([{ id: 2 }]);
  dobles.escribir.mockResolvedValue(undefined);
});
afterEach(() => vi.resetAllMocks());

describe("reemplazarHorarioTemporada", () => {
  it("guarda todo con la misma conexión y confirma la transacción", async () => {
    await expect(reemplazarHorarioTemporada(2, datos)).resolves.toBeUndefined();
    expect(dobles.conexion.beginTransaction).toHaveBeenCalledOnce();
    expect(dobles.escribir).toHaveBeenCalledWith(2, datos, dobles.conexion);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
    expect(dobles.conexion.rollback).not.toHaveBeenCalled();
    expect(dobles.bloquear).toHaveBeenCalledWith(dobles.conexion);
    expect(dobles.bloquear.mock.invocationCallOrder[0]).toBeLessThan(dobles.escribir.mock.invocationCallOrder[0]!);
    expect(dobles.consultar).toHaveBeenCalledWith(dobles.conexion, true);
  });
  it("admite cerrar toda la semana con una lista vacía", async () => {
    await reemplazarHorarioTemporada(2, []);
    expect(dobles.escribir).toHaveBeenCalledWith(2, [], dobles.conexion);
  });
  it("da 404 antes de escribir si falta el local", async () => {
    dobles.bloquear.mockResolvedValue(false);
    await expect(reemplazarHorarioTemporada(2, datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.escribir).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
  });
  it("da 404 si no existe la temporada", async () => {
    dobles.consultar.mockResolvedValue([]);
    await expect(reemplazarHorarioTemporada(2, datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.escribir).not.toHaveBeenCalled();
  });
  it("revierte fallos de escritura y libera la conexión", async () => {
    const error = new Error("Fallo de inserción");
    dobles.escribir.mockRejectedValue(error);
    await expect(reemplazarHorarioTemporada(2, datos)).rejects.toBe(error);
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});
