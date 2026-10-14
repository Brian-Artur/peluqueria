import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearExcepcion } from "./crearExcepcion";
import { ErrorConflicto } from "../errores";

const dobles = vi.hoisted(() => ({
  conectar: vi.fn(), bloquear: vi.fn(), consultar: vi.fn(), escribir: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/insertarExcepcion", () => ({ insertarExcepcion: dobles.escribir }));
const datos = { fecha: "2026-07-12", cerrado: false, motivo: "Bodas", tramos: [{ abre: "09:00", cierra: "14:00" }] };
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.bloquear.mockResolvedValue(true);
  dobles.consultar.mockResolvedValue([{ id: 2 }]);
  dobles.escribir.mockResolvedValue(7);
});
afterEach(() => vi.resetAllMocks());

describe("crearExcepcion", () => {
  it("guarda todo con la misma conexión y confirma la transacción", async () => {
    await expect(crearExcepcion(datos)).resolves.toBe(7);
    expect(dobles.conexion.beginTransaction).toHaveBeenCalledOnce();
    expect(dobles.escribir).toHaveBeenCalledWith(datos, dobles.conexion);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
    expect(dobles.conexion.rollback).not.toHaveBeenCalled();
  });
  it("revierte una fecha repetida (409) sin confirmar", async () => {
    dobles.escribir.mockRejectedValue(new ErrorConflicto("Ya existe una excepción para esa fecha"));
    await expect(crearExcepcion(datos)).rejects.toThrow(ErrorConflicto);
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
  it("revierte fallos de escritura y libera la conexión", async () => {
    const error = new Error("Fallo de inserción");
    dobles.escribir.mockRejectedValue(error);
    await expect(crearExcepcion(datos)).rejects.toBe(error);
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});
