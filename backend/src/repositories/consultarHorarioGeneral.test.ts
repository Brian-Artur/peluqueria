import { describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { consultarHorarioGeneral } from "./consultarHorarioGeneral";

describe("consultar horario general sin BD", () => {
  it("lee TIME como HH:MM, ordena y agrupa solo los tramos generales", async () => {
    const consultar = vi.fn().mockResolvedValue([[
      { dia_semana: 2, abre: "09:30", cierra: "14:00" },
      { dia_semana: 2, abre: "16:00", cierra: "20:00" },
    ]]);
    const conexion = { query: consultar } as unknown as Connection;
    await expect(consultarHorarioGeneral(conexion)).resolves.toEqual([{ dia_semana: 2, tramos: [{ abre: "09:30", cierra: "14:00" }, { abre: "16:00", cierra: "20:00" }] }]);
    const sql = consultar.mock.calls[0][0];
    expect(sql).toContain("TIME_FORMAT(abre, '%H:%i')");
    expect(sql).toContain("TIME_FORMAT(cierra, '%H:%i')");
    expect(sql).toContain("WHERE temporada_id IS NULL ORDER BY dia_semana, abre");
  });
});
