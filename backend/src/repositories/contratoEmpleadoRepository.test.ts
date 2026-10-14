import { afterEach, describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { cerrarContrato, consultarContratos, insertarContrato } from "./contratoEmpleadoRepository";

const dobles = vi.hoisted(() => ({ pool: vi.fn(), conexion: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: dobles.pool } }));
afterEach(() => vi.resetAllMocks());
const conexion = { query: dobles.conexion } as unknown as Connection;
const contrato = { id: 3, tipo: "practicas", desde: "2026-03-29", hasta: null, tutor_id: 1, tutor_nombre: "Ana", empresa: null };

describe("repositorio del historial sin BD", () => {
  it("lee ambos DATE como texto, incluye tutor y pide orden del más reciente al más antiguo", async () => {
    dobles.pool.mockResolvedValue([[{ ...contrato, empleado_id: 2 }], []]);
    await expect(consultarContratos(2)).resolves.toEqual([contrato]);
    expect(dobles.pool).toHaveBeenCalledWith(expect.stringContaining("DATE_FORMAT(c.desde, '%Y-%m-%d')"), [2]);
    const sql = dobles.pool.mock.calls[0][0];
    expect(sql).toContain("DATE_FORMAT(c.hasta, '%Y-%m-%d')");
    expect(sql).toContain("LEFT JOIN empleado t");
    expect(sql).toContain("ORDER BY c.desde DESC, c.id DESC");
  });

  it("usa exclusivamente la conexión de la transacción al consultar, insertar y cerrar", async () => {
    dobles.conexion.mockResolvedValueOnce([[contrato], []]).mockResolvedValue([{ insertId: 4 }, []]);
    await consultarContratos(2, conexion);
    const datos = { tipo: "plantilla" as const, desde: "2026-04-01", tutor_id: null, empresa: null };
    await expect(insertarContrato(2, datos, conexion)).resolves.toBe(4);
    expect(dobles.conexion).toHaveBeenLastCalledWith(expect.stringContaining("VALUES (?, ?, ?, ?, ?)"), [2, "plantilla", "2026-04-01", null, null]);
    await cerrarContrato(3, "2026-03-31", conexion);
    expect(dobles.conexion).toHaveBeenLastCalledWith("UPDATE contrato_empleado SET hasta = ? WHERE id = ?", ["2026-03-31", 3]);
    expect(dobles.pool).not.toHaveBeenCalled();
  });
});
