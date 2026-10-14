import { afterEach, describe, expect, it, vi } from "vitest";
import { obtenerEmpleado } from "./obtenerEmpleado";
import { ErrorNoEncontrado } from "../errores";

const dobles = vi.hoisted(() => ({ empleado: vi.fn(), contratos: vi.fn(), competencias: vi.fn() }));
vi.mock("../repositories/empleadoRepository", () => ({ buscarEmpleadoPorId: dobles.empleado }));
vi.mock("../repositories/contratoEmpleadoRepository", () => ({ consultarContratos: dobles.contratos }));
vi.mock("../repositories/competenciaRepository", () => ({ consultarCompetenciasEmpleado: dobles.competencias }));
afterEach(() => vi.resetAllMocks());

describe("obtener ficha de empleado", () => {
  it("compone los datos con historial y competencias también para inactivos", async () => {
    const empleado = { id: 1, nombre: "Ana", telefono: null, email: null, activo: false, contrato_vigente: null, num_competencias: 0, usuario_id: null, usuario_nombre: null };
    dobles.empleado.mockResolvedValue(empleado);
    dobles.contratos.mockResolvedValue([]);
    dobles.competencias.mockResolvedValue([]);
    await expect(obtenerEmpleado(1)).resolves.toEqual({ ...empleado, contratos: [], competencias: [] });
    expect(dobles.contratos).toHaveBeenCalledWith(1);
    expect(dobles.competencias).toHaveBeenCalledWith(1);
  });

  it("da 404 sin buscar el historial si no existe", async () => {
    dobles.empleado.mockResolvedValue(null);
    await expect(obtenerEmpleado(99)).rejects.toThrow(ErrorNoEncontrado);
    expect(dobles.contratos).not.toHaveBeenCalled();
    expect(dobles.competencias).not.toHaveBeenCalled();
  });
});
