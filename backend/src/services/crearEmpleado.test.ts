import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { crearEmpleado } from "./crearEmpleado";
import { ErrorConflicto } from "../errores";

const dobles = vi.hoisted(() => ({
  insertar: vi.fn(), contrato: vi.fn(), usuario: vi.fn(), tutor: vi.fn(), conectar: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/empleadoRepository", () => ({ insertarEmpleado: dobles.insertar }));
vi.mock("../repositories/contratoEmpleadoRepository", () => ({ insertarContrato: dobles.contrato }));
vi.mock("./validarUsuarioEmpleado", () => ({ validarUsuarioEmpleado: dobles.usuario }));
vi.mock("./validarTutorContrato", () => ({ validarTutorContrato: dobles.tutor }));
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.insertar.mockResolvedValue(7);
});
afterEach(() => vi.resetAllMocks());

const datos = {
  nombre: "Ana", telefono: null, email: null, usuario_id: 2,
  contrato: { tipo: "practicas" as const, desde: "2026-10-01", tutor_id: 1, empresa: null },
};

describe("crear empleado con primer contrato", () => {
  it("valida usuario y tutor y confirma ambos registros en la misma conexión", async () => {
    await expect(crearEmpleado(datos)).resolves.toBe(7);
    expect(dobles.usuario).toHaveBeenCalledWith(2, null, dobles.conexion);
    expect(dobles.insertar).toHaveBeenCalledWith(datos, dobles.conexion);
    expect(dobles.tutor).toHaveBeenCalledWith(1, 7, dobles.conexion);
    expect(dobles.contrato).toHaveBeenCalledWith(7, datos.contrato, dobles.conexion);
    expect(dobles.conexion.beginTransaction).toHaveBeenCalledOnce();
    expect(dobles.contrato.mock.invocationCallOrder[0]).toBeLessThan(dobles.conexion.commit.mock.invocationCallOrder[0]!);
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it("revierte el empleado si falla el primer contrato", async () => {
    dobles.contrato.mockRejectedValue(new Error("Fallo de contrato"));
    await expect(crearEmpleado(datos)).rejects.toThrow("Fallo de contrato");
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it("revierte si el tutor no es válido", async () => {
    dobles.tutor.mockRejectedValue(new ErrorConflicto("El tutor debe ser otro empleado activo"));
    await expect(crearEmpleado(datos)).rejects.toThrow(ErrorConflicto);
    expect(dobles.contrato).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
  });

  it("no inserta si el usuario ya está enlazado", async () => {
    dobles.usuario.mockRejectedValue(new ErrorConflicto("Ese usuario ya está enlazado a otro empleado"));
    await expect(crearEmpleado(datos)).rejects.toThrow(ErrorConflicto);
    expect(dobles.insertar).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
  });
});
