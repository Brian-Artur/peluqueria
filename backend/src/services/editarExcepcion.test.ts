import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { editarExcepcion } from "./editarExcepcion";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  conectar: vi.fn(), bloquear: vi.fn(), consultar: vi.fn(), escribir: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/actualizarExcepcion", () => ({ actualizarExcepcion: dobles.escribir, bloquearExcepcion: dobles.bloquear }));
const datos = { fecha: "2026-07-12", cerrado: false, motivo: "Bodas", tramos: [{ abre: "09:00", cierra: "14:00" }] };
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.bloquear.mockResolvedValue(true);
  dobles.consultar.mockResolvedValue([{ id: 2 }]);
  dobles.escribir.mockResolvedValue(undefined);
});
afterEach(() => vi.resetAllMocks());

describe("editarExcepcion", () => {
  it("guarda todo con la misma conexión y confirma la transacción", async () => {
    await expect(editarExcepcion(2, datos)).resolves.toBeUndefined();
    expect(dobles.conexion.beginTransaction).toHaveBeenCalledOnce();
    expect(dobles.escribir).toHaveBeenCalledWith(2, datos, dobles.conexion);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
    expect(dobles.conexion.rollback).not.toHaveBeenCalled();
    expect(dobles.bloquear).toHaveBeenCalledWith(2, dobles.conexion);
    expect(dobles.bloquear.mock.invocationCallOrder[0]).toBeLessThan(dobles.escribir.mock.invocationCallOrder[0]!);
  });
  it("da 404 antes de escribir si falta la excepción", async () => {
    dobles.bloquear.mockResolvedValue(false);
    await expect(editarExcepcion(2, datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.escribir).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
  });
  it("revierte una fecha repetida (409) sin confirmar", async () => {
    dobles.escribir.mockRejectedValue(new ErrorConflicto("Ya existe una excepción para esa fecha"));
    await expect(editarExcepcion(2, datos)).rejects.toThrow(ErrorConflicto);
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
  it("revierte fallos de escritura y libera la conexión", async () => {
    const error = new Error("Fallo de inserción");
    dobles.escribir.mockRejectedValue(error);
    await expect(editarExcepcion(2, datos)).rejects.toBe(error);
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});
