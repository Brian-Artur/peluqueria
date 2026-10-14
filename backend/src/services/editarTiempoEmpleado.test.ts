import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { editarTiempoEmpleado } from "./editarTiempoEmpleado";
import { ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  empleado: vi.fn(), tiempo: vi.fn(), actualizar: vi.fn(), historial: vi.fn(), conectar: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/empleadoRepository", () => ({ bloquearEmpleado: dobles.empleado }));
vi.mock("../repositories/editarTiempoEmpleado", () => ({
  bloquearTiempoEmpleado: dobles.tiempo, actualizarTiempoEmpleado: dobles.actualizar, insertarCambioTiempo: dobles.historial,
}));
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.empleado.mockResolvedValue({ id: 1 });
  dobles.tiempo.mockResolvedValue({ duracion_min: null, margen_min: 0 });
});
afterEach(() => vi.resetAllMocks());

describe("editar tiempos en una transacción", () => {
  it("registra cada campo cambiado con valores anteriores y usuario en la misma conexión", async () => {
    const datos = { duracion_min: 45, margen_min: 10 };
    await editarTiempoEmpleado(1, 2, datos, 7);
    expect(dobles.empleado).toHaveBeenCalledWith(1, dobles.conexion);
    expect(dobles.tiempo).toHaveBeenCalledWith(1, 2, dobles.conexion);
    expect(dobles.empleado.mock.invocationCallOrder[0]).toBeLessThan(dobles.tiempo.mock.invocationCallOrder[0]!);
    expect(dobles.actualizar).toHaveBeenCalledWith(1, 2, datos, dobles.conexion);
    expect(dobles.historial.mock.calls).toEqual([
      [1, 2, 7, "duracion", null, 45, dobles.conexion],
      [1, 2, 7, "margen", 0, 10, dobles.conexion],
    ]);
    expect(dobles.conexion.beginTransaction).toHaveBeenCalledOnce();
    expect(dobles.historial.mock.invocationCallOrder[1]).toBeLessThan(dobles.conexion.commit.mock.invocationCallOrder[0]!);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.rollback).not.toHaveBeenCalled();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it.each([
    [{ duracion_min: 45, margen_min: 0 }, "duracion", null, 45],
    [{ duracion_min: null, margen_min: 10 }, "margen", 0, 10],
  ] as const)("registra solo el campo cambiado con %j", async (datos, campo, anterior, nuevo) => {
    await editarTiempoEmpleado(1, 2, datos, 7);
    expect(dobles.historial).toHaveBeenCalledExactlyOnceWith(1, 2, 7, campo, anterior, nuevo, dobles.conexion);
  });

  it("registra al volver a duración heredada y margen cero", async () => {
    dobles.tiempo.mockResolvedValue({ duracion_min: 45, margen_min: 10 });
    await editarTiempoEmpleado(1, 2, { duracion_min: null, margen_min: 0 }, 7);
    expect(dobles.historial.mock.calls).toEqual([
      [1, 2, 7, "duracion", 45, null, dobles.conexion], [1, 2, 7, "margen", 10, 0, dobles.conexion],
    ]);
  });

  it("sin cambios no actualiza ni registra historial", async () => {
    await editarTiempoEmpleado(1, 2, { duracion_min: null, margen_min: 0 }, 7);
    expect(dobles.actualizar).not.toHaveBeenCalled();
    expect(dobles.historial).not.toHaveBeenCalled();
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
  });

  it.each(["empleado", "tiempo"] as const)("da 404 y revierte si falta %s", async (falta) => {
    dobles[falta].mockResolvedValue(null);
    await expect(editarTiempoEmpleado(1, 2, { duracion_min: 45, margen_min: 10 }, 7)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.actualizar).not.toHaveBeenCalled();
    expect(dobles.historial).not.toHaveBeenCalled();
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it.each(["actualizar", "primer historial", "segundo historial", "commit"])("revierte ante fallo en %s", async (paso) => {
    const fallo = new Error("Fallo simulado");
    if (paso === "actualizar") dobles.actualizar.mockRejectedValue(fallo);
    if (paso === "primer historial") dobles.historial.mockRejectedValueOnce(fallo);
    if (paso === "segundo historial") dobles.historial.mockResolvedValueOnce(undefined).mockRejectedValueOnce(fallo);
    if (paso === "commit") dobles.conexion.commit.mockRejectedValue(fallo);
    await expect(editarTiempoEmpleado(1, 2, { duracion_min: 45, margen_min: 10 }, 7)).rejects.toThrow(fallo);
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
    if (paso !== "commit") expect(dobles.conexion.commit).not.toHaveBeenCalled();
  });
});
