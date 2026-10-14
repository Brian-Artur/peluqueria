import { describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { consultarTemporadas } from "./consultarTemporadas";

describe("consultar temporadas sin BD", () => {
  it("traduce fechas, booleanos y tramos propios, incluida una temporada cerrada", async () => {
    const consultar = vi.fn()
      .mockResolvedValueOnce([[
        { id: 1, nombre: "Verano", desde: "2026-07-01", hasta: "2026-08-31", activa: 1 },
        { id: 2, nombre: "Invierno", desde: "2026-12-01", hasta: "2026-12-31", activa: 0 },
      ]])
      .mockResolvedValueOnce([[{ temporada_id: 1, dia_semana: 2, abre: "08:00", cierra: "15:00" }]]);
    const conexion = { query: consultar } as unknown as Connection;
    expect(await consultarTemporadas(conexion)).toEqual([
      { id: 1, nombre: "Verano", desde: "2026-07-01", hasta: "2026-08-31", activa: true, horario: [{ dia_semana: 2, tramos: [{ abre: "08:00", cierra: "15:00" }] }] },
      { id: 2, nombre: "Invierno", desde: "2026-12-01", hasta: "2026-12-31", activa: false, horario: [] },
    ]);
    expect(consultar.mock.calls[0][0]).toContain("DATE_FORMAT(desde, '%Y-%m-%d')");
    expect(consultar.mock.calls[0][0]).toContain("DATE_FORMAT(hasta, '%Y-%m-%d')");
    expect(consultar.mock.calls[0][0]).not.toContain("FOR UPDATE");
    expect(consultar.mock.calls[1][0]).toContain("TIME_FORMAT(abre, '%H:%i')");
    expect(consultar.mock.calls[1][0]).toContain("TIME_FORMAT(cierra, '%H:%i')");
    expect(consultar.mock.calls[1][0]).toContain("ORDER BY temporada_id, dia_semana, abre");
  });
  it("usa una lectura actual con bloqueo para validar cambios de rangos", async () => {
    const consultar = vi.fn().mockResolvedValue([[]]);
    await consultarTemporadas({ query: consultar } as unknown as Connection, true);
    expect(consultar.mock.calls[0][0]).toContain("FOR UPDATE");
  });
});
