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
    dobles.pool.mockResolvedValue([[{ empleado_id: 1, servicio_id: 2, nivel: "experto", duracion_min: 45, margen_min: 10 }], []]);
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

  it("conserva duración y margen de los mantenidos: borra solo los quitados y actualiza solo el nivel", async () => {
    dobles.conexion.mockResolvedValue([{}, []]);
    await sustituirCompetencias(1, [{ servicio_id: 2, nivel: "autonomo" }, { servicio_id: 3, nivel: "experto" }], conexion);
    expect(dobles.conexion.mock.calls[0]).toEqual([
      "DELETE FROM competencia WHERE empleado_id = ? AND servicio_id NOT IN (?, ?)", [1, 2, 3],
    ]);
    expect(dobles.conexion).toHaveBeenNthCalledWith(2, expect.stringContaining("ON DUPLICATE KEY UPDATE nivel = VALUES(nivel)"), [1, 2, "autonomo"]);
    expect(dobles.conexion).toHaveBeenNthCalledWith(3, expect.stringContaining("ON DUPLICATE KEY UPDATE nivel = VALUES(nivel)"), [1, 3, "experto"]);
    expect(dobles.conexion).toHaveBeenCalledTimes(3);
    for (const [sql] of dobles.conexion.mock.calls.slice(1)) {
      expect(sql.split("ON DUPLICATE KEY UPDATE ")[1]).toBe("nivel = VALUES(nivel)");
      expect(sql).not.toContain("duracion_min");
      expect(sql).not.toContain("margen_min");
    }
    expect(dobles.pool).not.toHaveBeenCalled();
  });

  it("admite vaciar sin generar NOT IN vacío", async () => {
    dobles.conexion.mockResolvedValue([{}, []]);
    await sustituirCompetencias(1, [], conexion);
    expect(dobles.conexion).toHaveBeenCalledExactlyOnceWith("DELETE FROM competencia WHERE empleado_id = ?", [1]);
  });
});
