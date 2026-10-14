import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reemplazarCompetencias } from "./reemplazarCompetencias";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  bloquear: vi.fn(), servicios: vi.fn(), sustituir: vi.fn(), conectar: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/empleadoRepository", () => ({ bloquearEmpleado: dobles.bloquear }));
vi.mock("../repositories/competenciaRepository", () => ({ consultarServiciosExistentes: dobles.servicios, sustituirCompetencias: dobles.sustituir }));
const competencias = [{ servicio_id: 2, nivel: "aprendiz" as const }, { servicio_id: 3, nivel: "experto" as const }];
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.bloquear.mockResolvedValue({ id: 1, activo: true });
  dobles.servicios.mockResolvedValue([2, 3]);
});
afterEach(() => vi.resetAllMocks());

describe("reemplazar competencias", () => {
  it("comprueba todos los servicios antes de reemplazar y confirmar en la misma conexión", async () => {
    await reemplazarCompetencias(1, competencias);
    expect(dobles.bloquear).toHaveBeenCalledWith(1, dobles.conexion);
    expect(dobles.servicios).toHaveBeenCalledWith([2, 3], dobles.conexion);
    expect(dobles.servicios.mock.invocationCallOrder[0]).toBeLessThan(dobles.sustituir.mock.invocationCallOrder[0]!);
    expect(dobles.sustituir).toHaveBeenCalledWith(1, competencias, dobles.conexion);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it("admite vaciar las competencias", async () => {
    dobles.servicios.mockResolvedValue([]);
    await reemplazarCompetencias(1, []);
    expect(dobles.sustituir).toHaveBeenCalledWith(1, [], dobles.conexion);
  });

  it("da 409 sin sustituir si falta cualquier servicio", async () => {
    dobles.servicios.mockResolvedValue([2]);
    await expect(reemplazarCompetencias(1, competencias)).rejects.toThrow(new ErrorConflicto("El servicio 3 no existe"));
    expect(dobles.sustituir).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
  });

  it("da 404 si el empleado no existe", async () => {
    dobles.bloquear.mockResolvedValue(null);
    await expect(reemplazarCompetencias(99, competencias)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.sustituir).not.toHaveBeenCalled();
  });

  it("revierte ante un fallo al insertar las competencias", async () => {
    dobles.sustituir.mockRejectedValue(new Error("Fallo de inserción"));
    await expect(reemplazarCompetencias(1, competencias)).rejects.toThrow("Fallo de inserción");
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});
