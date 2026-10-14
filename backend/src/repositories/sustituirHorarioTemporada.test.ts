import { describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { sustituirHorarioTemporada } from "./sustituirHorarioTemporada";

describe("sustituir horario de una temporada sin BD", () => {
  it("borra solo los tramos de esa temporada e inserta los nuevos parametrizados", async () => {
    const consultar = vi.fn().mockResolvedValue([]);
    await sustituirHorarioTemporada(7, [{ dia_semana: 2, tramos: [{ abre: "08:00", cierra: "15:00" }] }], { query: consultar } as unknown as Connection);
    expect(consultar).toHaveBeenNthCalledWith(1, "DELETE FROM horario_tramo WHERE temporada_id = ?", [7]);
    expect(consultar).toHaveBeenNthCalledWith(2, expect.stringContaining("VALUES (?, ?, ?, ?)"), [7, 2, "08:00", "15:00"]);
  });
  it("admite cerrar toda la semana", async () => {
    const consultar = vi.fn().mockResolvedValue([]);
    await sustituirHorarioTemporada(7, [], { query: consultar } as unknown as Connection);
    expect(consultar).toHaveBeenCalledExactlyOnceWith("DELETE FROM horario_tramo WHERE temporada_id = ?", [7]);
  });
});
