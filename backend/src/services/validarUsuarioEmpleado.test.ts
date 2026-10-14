import { afterEach, describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { ErrorConflicto } from "../errores";
import { validarUsuarioEmpleado } from "./validarUsuarioEmpleado";

const dobles = vi.hoisted(() => ({ usuario: vi.fn(), enlazado: vi.fn() }));
vi.mock("../repositories/usuarioRepository", () => ({ buscarUsuarioPorId: dobles.usuario }));
vi.mock("../repositories/empleadoRepository", () => ({ buscarEmpleadoPorUsuario: dobles.enlazado }));
afterEach(() => vi.resetAllMocks());
const conexion = {} as Connection;

describe("validar el usuario de un empleado", () => {
  it.each([null, undefined])("no consulta al omitir o quitar el enlace: %s", async (usuarioId) => {
    await validarUsuarioEmpleado(usuarioId, 1, conexion);
    expect(dobles.usuario).not.toHaveBeenCalled();
  });

  it.each([null, 1])("admite un usuario libre o ya enlazado al mismo empleado: %s", async (enlazado) => {
    dobles.usuario.mockResolvedValue({ id: 5 });
    dobles.enlazado.mockResolvedValue(enlazado);
    await validarUsuarioEmpleado(5, 1, conexion);
    expect(dobles.usuario).toHaveBeenCalledWith(5, conexion);
    expect(dobles.enlazado).toHaveBeenCalledWith(5, conexion);
  });

  it("da 409 si el usuario no existe", async () => {
    dobles.usuario.mockResolvedValue(null);
    await expect(validarUsuarioEmpleado(99, null, conexion)).rejects.toThrow(new ErrorConflicto("El usuario indicado no existe"));
    expect(dobles.enlazado).not.toHaveBeenCalled();
  });

  it("da 409 si pertenece a otro empleado", async () => {
    dobles.usuario.mockResolvedValue({ id: 5 });
    dobles.enlazado.mockResolvedValue(2);
    await expect(validarUsuarioEmpleado(5, 1, conexion)).rejects.toThrow(new ErrorConflicto("Ese usuario ya está enlazado a otro empleado"));
  });
});
