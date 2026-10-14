import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { darBajaEmpleado } from "./darBajaEmpleado";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  bloquear: vi.fn(), actividad: vi.fn(), contratos: vi.fn(), cerrar: vi.fn(), conectar: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/empleadoRepository", () => ({ bloquearEmpleado: dobles.bloquear, cambiarActividadEmpleado: dobles.actividad }));
vi.mock("../repositories/contratoEmpleadoRepository", () => ({ consultarContratos: dobles.contratos, cerrarContrato: dobles.cerrar }));
const vigente = { id: 3, tipo: "plantilla", desde: "2026-04-01", hasta: null, tutor_id: null, tutor_nombre: null, empresa: null };
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.bloquear.mockResolvedValue({ id: 1, activo: true });
  dobles.contratos.mockResolvedValue([vigente]);
});
afterEach(() => vi.resetAllMocks());

describe("dar de baja un empleado", () => {
  it.each(["2026-04-01", "2026-10-14"])("cierra y desactiva sin borrar: %s", async (fecha) => {
    await darBajaEmpleado(1, { fecha });
    expect(dobles.bloquear).toHaveBeenCalledWith(1, dobles.conexion);
    expect(dobles.bloquear.mock.invocationCallOrder[0]).toBeLessThan(dobles.contratos.mock.invocationCallOrder[0]!);
    expect(dobles.cerrar).toHaveBeenCalledWith(3, fecha, dobles.conexion);
    expect(dobles.actividad).toHaveBeenCalledWith(1, false, dobles.conexion);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it("rechaza la baja anterior al inicio con 409", async () => {
    await expect(darBajaEmpleado(1, { fecha: "2026-03-31" })).rejects.toThrow(new ErrorConflicto("La baja no puede ser anterior al inicio del contrato vigente"));
    expect(dobles.cerrar).not.toHaveBeenCalled();
    expect(dobles.actividad).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
  });

  it.each([
    { contratos: [] },
    { contratos: [{ ...vigente, hasta: "2026-05-01" }] },
    { contratos: [vigente, { ...vigente, id: 4 }] },
  ])(
    "rechaza historial sin vigente o con varios: $contratos", async ({ contratos }) => {
      dobles.contratos.mockResolvedValue(contratos);
      await expect(darBajaEmpleado(1, { fecha: "2026-10-14" })).rejects.toThrow(ErrorConflicto);
      expect(dobles.actividad).not.toHaveBeenCalled();
    }
  );

  it("da 404 si el empleado no existe", async () => {
    dobles.bloquear.mockResolvedValue(null);
    await expect(darBajaEmpleado(99, { fecha: "2026-10-14" })).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.cerrar).not.toHaveBeenCalled();
  });

  it("revierte el cierre si falla la desactivación", async () => {
    dobles.actividad.mockRejectedValue(new Error("Fallo de actualización"));
    await expect(darBajaEmpleado(1, { fecha: "2026-10-14" })).rejects.toThrow("Fallo de actualización");
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});
