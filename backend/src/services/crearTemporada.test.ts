import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearTemporada } from "./crearTemporada";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  conectar: vi.fn(), bloquear: vi.fn(), consultar: vi.fn(), insertar: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/bloquearConfiguracionHorario", () => ({ bloquearConfiguracionHorario: dobles.bloquear }));
vi.mock("../repositories/consultarTemporadas", () => ({ consultarTemporadas: dobles.consultar }));
vi.mock("../repositories/insertarTemporada", () => ({ insertarTemporada: dobles.insertar }));
const datos = { nombre: "Verano", desde: "2026-07-01", hasta: "2026-08-31", activa: true };
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.bloquear.mockResolvedValue(true);
  dobles.consultar.mockResolvedValue([]);
  dobles.insertar.mockResolvedValue(7);
});
afterEach(() => vi.resetAllMocks());

describe("crear temporada", () => {
  it("bloquea la configuración antes de leer los rangos actuales e insertar en la misma transacción", async () => {
    await expect(crearTemporada(datos)).resolves.toBe(7);
    expect(dobles.bloquear).toHaveBeenCalledWith(dobles.conexion);
    expect(dobles.consultar).toHaveBeenCalledWith(dobles.conexion, true);
    expect(dobles.bloquear.mock.invocationCallOrder[0]).toBeLessThan(dobles.consultar.mock.invocationCallOrder[0]!);
    expect(dobles.consultar.mock.invocationCallOrder[0]).toBeLessThan(dobles.insertar.mock.invocationCallOrder[0]!);
    expect(dobles.insertar).toHaveBeenCalledWith(datos, dobles.conexion);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
  it("rechaza solapamientos activos con 409 y revierte", async () => {
    dobles.consultar.mockResolvedValue([{ ...datos, id: 1, horario: [] }]);
    await expect(crearTemporada(datos)).rejects.toThrow(ErrorConflicto);
    expect(dobles.insertar).not.toHaveBeenCalled();
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
  it("rechaza el rango invertido con 409", async () => {
    await expect(crearTemporada({ ...datos, desde: "2026-09-01" })).rejects.toThrow(ErrorConflicto);
    expect(dobles.insertar).not.toHaveBeenCalled();
  });
  it("admite una inactiva solapada", async () => {
    dobles.consultar.mockResolvedValue([{ ...datos, id: 1, horario: [] }]);
    await expect(crearTemporada({ ...datos, activa: false })).resolves.toBe(7);
  });
  it("da 404 si falta la configuración del local", async () => {
    dobles.bloquear.mockResolvedValue(false);
    await expect(crearTemporada(datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.consultar).not.toHaveBeenCalled();
    expect(dobles.insertar).not.toHaveBeenCalled();
  });
  it("revierte un fallo de escritura y libera la conexión", async () => {
    const error = new Error("Fallo de escritura");
    dobles.insertar.mockRejectedValue(error);
    await expect(crearTemporada(datos)).rejects.toBe(error);
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});
