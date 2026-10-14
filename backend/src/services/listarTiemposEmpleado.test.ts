import { afterEach, describe, expect, it, vi } from "vitest";
import { listarTiemposEmpleado } from "./listarTiemposEmpleado";
import { ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({ empleado: vi.fn(), tiempos: vi.fn() }));
vi.mock("../repositories/empleadoRepository", () => ({ buscarEmpleadoPorId: dobles.empleado }));
vi.mock("../repositories/consultarTiemposEmpleado", () => ({ consultarTiemposEmpleado: dobles.tiempos }));
afterEach(() => vi.resetAllMocks());

describe("listar tiempos de empleado", () => {
  it("calcula la duración agendada en el backend", async () => {
    dobles.empleado.mockResolvedValue({ id: 1, activo: false });
    const tiempo = { servicio_id: 2, duracion_servicio: 30, duracion_propia: 45, margen_servicio: 5, margen_propio: 10 };
    dobles.tiempos.mockResolvedValue([tiempo]);
    await expect(listarTiemposEmpleado(1)).resolves.toEqual([{ ...tiempo, duracion_agendada: 60 }]);
    expect(dobles.tiempos).toHaveBeenCalledWith(1);
  });
  it("admite un empleado sin competencias", async () => {
    dobles.empleado.mockResolvedValue({ id: 1 });
    dobles.tiempos.mockResolvedValue([]);
    await expect(listarTiemposEmpleado(1)).resolves.toEqual([]);
  });
  it("da 404 sin consultar tiempos si el empleado no existe", async () => {
    dobles.empleado.mockResolvedValue(null);
    await expect(listarTiemposEmpleado(99)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.tiempos).not.toHaveBeenCalled();
  });
});
