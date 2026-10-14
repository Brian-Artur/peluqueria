import { afterEach, describe, expect, it, vi } from "vitest";
import { consultarHistorialTiempo } from "./consultarHistorialTiempo";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());

describe("historial de tiempos sin BD", () => {
  it("traduce fechas, conserva null y consulta los últimos 50 con desempate por id", async () => {
    const fila = { servicio_nombre: "Corte", campo: "duracion", valor_anterior: 45, valor_nuevo: null,
      usuario_nombre: "Admin", cambiado_en: new Date("2026-10-14T12:00:00Z"), interno: "privado" };
    consultar.mockResolvedValue([[fila], []]);
    await expect(consultarHistorialTiempo(1)).resolves.toEqual([{
      servicio_nombre: "Corte", campo: "duracion", valor_anterior: 45, valor_nuevo: null,
      usuario_nombre: "Admin", cambiado_en: "2026-10-14T12:00:00.000Z",
    }]);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("WHERE h.empleado_id = ?"), [1]);
    const sql = consultar.mock.calls[0][0];
    expect(sql).toContain("ORDER BY h.cambiado_en DESC, h.id DESC LIMIT 50");
    expect(sql).not.toContain("activo");
  });
});
