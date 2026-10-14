import { describe, expect, it } from "vitest";
import { agruparTramosSemanales } from "./agruparTramosSemanales";

describe("traducir las filas del horario semanal", () => {
  it("agrupa varios tramos y descarta los campos propios de la BD", () => {
    const filas = [
      { dia_semana: 2, abre: "09:30", cierra: "14:00", id: 1, temporada_id: 7 },
      { dia_semana: 2, abre: "16:00", cierra: "20:00", id: 2, temporada_id: 7 },
      { dia_semana: 6, abre: "09:00", cierra: "15:00", id: 3, temporada_id: 7 },
    ];
    expect(agruparTramosSemanales(filas)).toEqual([
      { dia_semana: 2, tramos: [{ abre: "09:30", cierra: "14:00" }, { abre: "16:00", cierra: "20:00" }] },
      { dia_semana: 6, tramos: [{ abre: "09:00", cierra: "15:00" }] },
    ]);
  });
  it("sin filas devuelve una semana cerrada", () => {
    expect(agruparTramosSemanales([])).toEqual([]);
  });
});
