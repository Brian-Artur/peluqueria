import { describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { sustituirHorarioGeneral } from "./sustituirHorarioGeneral";

describe("sustituir horario general sin BD", () => {
  it("borra solo el general e inserta cada tramo parametrizado", async () => {
    const consultar = vi.fn().mockResolvedValue([]);
    await sustituirHorarioGeneral([{ dia_semana: 2, tramos: [{ abre: "09:30", cierra: "14:00" }, { abre: "16:00", cierra: "20:00" }] }], { query: consultar } as unknown as Connection);
    expect(consultar).toHaveBeenNthCalledWith(1, "DELETE FROM horario_tramo WHERE temporada_id IS NULL");
    expect(consultar).toHaveBeenNthCalledWith(2, expect.stringContaining("VALUES (NULL, ?, ?, ?)"), [2, "09:30", "14:00"]);
    expect(consultar).toHaveBeenNthCalledWith(3, expect.stringContaining("VALUES (NULL, ?, ?, ?)"), [2, "16:00", "20:00"]);
  });
  it("una lista vacía elimina todos los tramos generales", async () => {
    const consultar = vi.fn().mockResolvedValue([]);
    await sustituirHorarioGeneral([], { query: consultar } as unknown as Connection);
    expect(consultar).toHaveBeenCalledExactlyOnceWith("DELETE FROM horario_tramo WHERE temporada_id IS NULL");
  });
});
