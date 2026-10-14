import type { Contrato } from "@peluqueria/compartido";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nuevoContratoEmpleado } from "./nuevoContratoEmpleado";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  bloquear: vi.fn(), actividad: vi.fn(), contratos: vi.fn(), cerrar: vi.fn(), insertar: vi.fn(), tutor: vi.fn(), conectar: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/empleadoRepository", () => ({ bloquearEmpleado: dobles.bloquear, cambiarActividadEmpleado: dobles.actividad }));
vi.mock("../repositories/contratoEmpleadoRepository", () => ({ consultarContratos: dobles.contratos, cerrarContrato: dobles.cerrar, insertarContrato: dobles.insertar }));
vi.mock("./validarTutorContrato", () => ({ validarTutorContrato: dobles.tutor }));

const vigente: Contrato = { id: 3, tipo: "prueba", desde: "2026-01-01", hasta: null, tutor_id: null, tutor_nombre: null, empresa: null };
const datos = { tipo: "plantilla" as const, desde: "2026-04-01", tutor_id: null, empresa: null };
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.bloquear.mockResolvedValue({ id: 1, activo: true });
  dobles.contratos.mockResolvedValue([vigente]);
  dobles.insertar.mockResolvedValue(4);
});
afterEach(() => vi.resetAllMocks());

describe("abrir un nuevo contrato", () => {
  it("bloquea antes de leer el historial, cierra el anterior y abre el nuevo en una transacción", async () => {
    await expect(nuevoContratoEmpleado(1, datos)).resolves.toBe(4);
    expect(dobles.bloquear).toHaveBeenCalledWith(1, dobles.conexion);
    expect(dobles.contratos).toHaveBeenCalledWith(1, dobles.conexion);
    expect(dobles.bloquear.mock.invocationCallOrder[0]).toBeLessThan(dobles.contratos.mock.invocationCallOrder[0]!);
    expect(dobles.cerrar).toHaveBeenCalledWith(3, "2026-03-31", dobles.conexion);
    expect(dobles.insertar).toHaveBeenCalledWith(1, datos, dobles.conexion);
    expect(dobles.cerrar.mock.invocationCallOrder[0]).toBeLessThan(dobles.insertar.mock.invocationCallOrder[0]!);
    expect(dobles.actividad).toHaveBeenCalledWith(1, true, dobles.conexion);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it.each([
    ["2026-03-30", "2026-03-29"], ["2026-10-26", "2026-10-25"],
    ["2028-03-01", "2028-02-29"], ["2027-01-01", "2026-12-31"],
  ])("resta un día civil sin depender de la zona: %s → %s", async (desde, hasta) => {
    await nuevoContratoEmpleado(1, { ...datos, desde });
    expect(dobles.cerrar).toHaveBeenCalledWith(3, hasta, dobles.conexion);
  });

  it.each(["2025-12-31", "2026-01-01"])("rechaza empezar antes o el mismo día que el vigente: %s", async (desde) => {
    await expect(nuevoContratoEmpleado(1, { ...datos, desde })).rejects.toThrow(new ErrorConflicto("El nuevo contrato debe empezar después del inicio del contrato vigente"));
    expect(dobles.cerrar).not.toHaveBeenCalled();
    expect(dobles.insertar).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
  });

  it("rechaza historiales con dos vigentes", async () => {
    dobles.contratos.mockResolvedValue([vigente, { ...vigente, id: 5 }]);
    await expect(nuevoContratoEmpleado(1, datos)).rejects.toThrow(ErrorConflicto);
    expect(dobles.insertar).not.toHaveBeenCalled();
  });

  it.each(["2026-03-01", "2026-03-31"])("no solapa con un contrato cerrado, incluidos los extremos: %s", async (desde) => {
    dobles.contratos.mockResolvedValue([{ ...vigente, hasta: "2026-03-31" }]);
    await expect(nuevoContratoEmpleado(1, { ...datos, desde })).rejects.toThrow(new ErrorConflicto("El nuevo contrato se solapa con el historial del empleado"));
    expect(dobles.insertar).not.toHaveBeenCalled();
  });

  it("reactiva tras una baja cuando el nuevo contrato empieza después del último cerrado", async () => {
    dobles.bloquear.mockResolvedValue({ id: 1, activo: false });
    dobles.contratos.mockResolvedValue([{ ...vigente, hasta: "2026-03-31" }]);
    await nuevoContratoEmpleado(1, datos);
    expect(dobles.cerrar).not.toHaveBeenCalled();
    expect(dobles.actividad).toHaveBeenCalledWith(1, true, dobles.conexion);
  });

  it("da 404 si no existe", async () => {
    dobles.bloquear.mockResolvedValue(null);
    await expect(nuevoContratoEmpleado(99, datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.contratos).not.toHaveBeenCalled();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it("valida tutor antes de cerrar y revierte ante conflicto", async () => {
    dobles.tutor.mockRejectedValue(new ErrorConflicto("Un empleado no puede ser su propio tutor"));
    await expect(nuevoContratoEmpleado(1, { ...datos, tipo: "practicas", tutor_id: 1 })).rejects.toThrow(ErrorConflicto);
    expect(dobles.tutor).toHaveBeenCalledWith(1, 1, dobles.conexion);
    expect(dobles.cerrar).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
  });

  it("revierte el cierre si falla la apertura del nuevo contrato", async () => {
    dobles.insertar.mockRejectedValue(new Error("Fallo de inserción"));
    await expect(nuevoContratoEmpleado(1, datos)).rejects.toThrow("Fallo de inserción");
    expect(dobles.cerrar).toHaveBeenCalledOnce();
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });
});
