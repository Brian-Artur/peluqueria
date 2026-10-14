import { afterEach, describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { ErrorConflicto } from "../errores";
import { validarTutorContrato } from "./validarTutorContrato";

const dobles = vi.hoisted(() => ({ empleado: vi.fn() }));
vi.mock("../repositories/empleadoRepository", () => ({ bloquearEmpleado: dobles.empleado }));
afterEach(() => vi.resetAllMocks());
const conexion = {} as Connection;

describe("validar tutor de prácticas", () => {
  it("admite no tener tutor", async () => {
    await validarTutorContrato(null, 1, conexion);
    expect(dobles.empleado).not.toHaveBeenCalled();
  });

  it("rechaza tutoría propia con 409", async () => {
    await expect(validarTutorContrato(1, 1, conexion)).rejects.toThrow(new ErrorConflicto("Un empleado no puede ser su propio tutor"));
    expect(dobles.empleado).not.toHaveBeenCalled();
  });

  it.each([null, { id: 2, activo: false }])("rechaza tutor inexistente o inactivo: %j", async (tutor) => {
    dobles.empleado.mockResolvedValue(tutor);
    await expect(validarTutorContrato(2, 1, conexion)).rejects.toThrow(new ErrorConflicto("El tutor debe ser otro empleado activo"));
  });

  it("bloquea al tutor activo dentro de la transacción", async () => {
    dobles.empleado.mockResolvedValue({ id: 2, activo: true });
    await validarTutorContrato(2, 1, conexion);
    expect(dobles.empleado).toHaveBeenCalledWith(2, conexion);
  });
});
