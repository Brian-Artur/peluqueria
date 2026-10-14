import { afterEach, describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { consultarCompetenciasActivas, consultarCompetenciasEmpleado, consultarServiciosExistentes, sustituirCompetencias } from "./competenciaRepository";

const dobles = vi.hoisted(() => ({ pool: vi.fn(), conexion: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: dobles.pool } }));
afterEach(() => vi.resetAllMocks());
const conexion = { query: dobles.conexion } as unknown as Connection;

describe("repositorio de competencias sin BD", () => {
  it("el cuadro resumen solo consulta empleados activos y conserva empleado_id", async () => {
    dobles.pool.mockResolvedValue([[{ empleado_id: 1, servicio_id: 2, nivel: "aprendiz", interno: "privado" }], []]);
    await expect(consultarCompetenciasActivas()).resolves.toEqual([{ empleado_id: 1, servicio_id: 2, nivel: "aprendiz" }]);
    expect(dobles.pool).toHaveBeenCalledWith(expect.stringContaining("e.activo = TRUE"));
  });

  it("la ficha puede consultar competencias de cualquier empleado", async () => {
    dobles.pool.mockResolvedValue([[{ empleado_id: 1, servicio_id: 2, nivel: "experto" }], []]);
    await expect(consultarCompetenciasEmpleado(1)).resolves.toEqual([{ servicio_id: 2, nivel: "experto" }]);
    expect(dobles.pool).toHaveBeenCalledWith(expect.stringContaining("WHERE empleado_id = ?"), [1]);
  });

  it("consulta servicios con parámetros, incluidos los inactivos, y admite lista vacía", async () => {
    await expect(consultarServiciosExistentes([], conexion)).resolves.toEqual([]);
    expect(dobles.conexion).not.toHaveBeenCalled();
    dobles.conexion.mockResolvedValue([[{ id: 2 }, { id: 3 }], []]);
    await expect(consultarServiciosExistentes([2, 3], conexion)).resolves.toEqual([2, 3]);
    expect(dobles.conexion).toHaveBeenCalledWith(expect.stringContaining("WHERE id IN (?, ?)"), [2, 3]);
    expect(dobles.conexion.mock.calls[0][0]).not.toContain("activo");
  });

  it("borra solo las competencias del empleado y repone la lista en la conexión recibida", async () => {
    dobles.conexion.mockResolvedValue([{}, []]);
    await sustituirCompetencias(1, [{ servicio_id: 2, nivel: "autonomo" }, { servicio_id: 3, nivel: "experto" }], conexion);
    expect(dobles.conexion.mock.calls).toEqual([
      ["DELETE FROM competencia WHERE empleado_id = ?", [1]],
      ["INSERT INTO competencia (empleado_id, servicio_id, nivel) VALUES (?, ?, ?)", [1, 2, "autonomo"]],
      ["INSERT INTO competencia (empleado_id, servicio_id, nivel) VALUES (?, ?, ?)", [1, 3, "experto"]],
    ]);
    expect(dobles.pool).not.toHaveBeenCalled();
  });
});
