import { describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { consultarExcepciones } from "./consultarExcepciones";

describe("consultar excepciones sin BD", () => {
  it("traduce fechas, cierres y los tramos de cada excepción", async () => {
    const consultar = vi.fn()
      .mockResolvedValueOnce([[
        { id: 1, fecha: "2026-07-12", cerrado: 0, motivo: "Bodas" },
        { id: 2, fecha: "2026-08-15", cerrado: 1, motivo: "Festivo" },
      ]])
      .mockResolvedValueOnce([[{ excepcion_id: 1, abre: "09:00", cierra: "14:00" }]]);
    const conexion = { query: consultar } as unknown as Connection;
    expect(await consultarExcepciones(conexion)).toEqual([
      { id: 1, fecha: "2026-07-12", cerrado: false, motivo: "Bodas", tramos: [{ abre: "09:00", cierra: "14:00" }] },
      { id: 2, fecha: "2026-08-15", cerrado: true, motivo: "Festivo", tramos: [] },
    ]);
    expect(consultar.mock.calls[0][0]).toContain("DATE_FORMAT(fecha, '%Y-%m-%d')");
    expect(consultar.mock.calls[1][0]).toContain("TIME_FORMAT(abre, '%H:%i')");
    expect(consultar.mock.calls[1][0]).toContain("TIME_FORMAT(cierra, '%H:%i')");
    expect(consultar.mock.calls[1][0]).toContain("ORDER BY excepcion_id, abre");
  });
});
