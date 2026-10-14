import { afterEach, describe, expect, it, vi } from "vitest";
import { listarHistorialTiempo } from "./listarHistorialTiempo";
import { ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({ empleado: vi.fn(), historial: vi.fn() }));
vi.mock("../repositories/empleadoRepository", () => ({ buscarEmpleadoPorId: dobles.empleado }));
vi.mock("../repositories/consultarHistorialTiempo", () => ({ consultarHistorialTiempo: dobles.historial }));
afterEach(() => vi.resetAllMocks());

describe("listar historial de tiempos", () => {
  it("conserva la respuesta y admite un historial vacío", async () => {
    dobles.empleado.mockResolvedValue({ id: 1 });
    dobles.historial.mockResolvedValue([]);
    await expect(listarHistorialTiempo(1)).resolves.toEqual([]);
    expect(dobles.historial).toHaveBeenCalledWith(1);
  });
  it("da 404 sin consultar historial si el empleado no existe", async () => {
    dobles.empleado.mockResolvedValue(null);
    await expect(listarHistorialTiempo(99)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.historial).not.toHaveBeenCalled();
  });
});
