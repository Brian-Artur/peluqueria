import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { editarEmpleado } from "./editarEmpleado";
import { ErrorConflicto, ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({
  bloquear: vi.fn(), actualizar: vi.fn(), usuario: vi.fn(), conectar: vi.fn(),
  conexion: { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() },
}));
vi.mock("../db", () => ({ pool: { getConnection: dobles.conectar } }));
vi.mock("../repositories/empleadoRepository", () => ({ bloquearEmpleado: dobles.bloquear, actualizarEmpleado: dobles.actualizar }));
vi.mock("./validarUsuarioEmpleado", () => ({ validarUsuarioEmpleado: dobles.usuario }));
beforeEach(() => {
  dobles.conectar.mockResolvedValue(dobles.conexion);
  dobles.bloquear.mockResolvedValue({ id: 1, activo: false, usuario_id: 5 });
});
afterEach(() => vi.resetAllMocks());
const datos = { nombre: "Ana", telefono: null, email: null };

describe("editar datos del empleado", () => {
  it("conserva el enlace si se omite usuario_id y permite editar empleados inactivos", async () => {
    await editarEmpleado(1, datos);
    expect(dobles.actualizar).toHaveBeenCalledWith(1, { ...datos, usuario_id: 5 }, dobles.conexion);
    expect(dobles.conexion.commit).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it.each([null, 8])("permite quitar o cambiar el enlace: %s", async (usuario_id) => {
    await editarEmpleado(1, { ...datos, usuario_id });
    expect(dobles.usuario).toHaveBeenCalledWith(usuario_id, 1, dobles.conexion);
    expect(dobles.actualizar).toHaveBeenCalledWith(1, { ...datos, usuario_id }, dobles.conexion);
  });

  it("da 404 y revierte si no existe el empleado", async () => {
    dobles.bloquear.mockResolvedValue(null);
    await expect(editarEmpleado(99, datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.actualizar).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
    expect(dobles.conexion.release).toHaveBeenCalledOnce();
  });

  it("no actualiza si el usuario no es válido", async () => {
    dobles.usuario.mockRejectedValue(new ErrorConflicto("El usuario indicado no existe"));
    await expect(editarEmpleado(1, { ...datos, usuario_id: 99 })).rejects.toThrow(ErrorConflicto);
    expect(dobles.actualizar).not.toHaveBeenCalled();
    expect(dobles.conexion.commit).not.toHaveBeenCalled();
    expect(dobles.conexion.rollback).toHaveBeenCalledOnce();
  });
});
