import { describe, expect, it } from "vitest";
import { resolverSemana } from "./resolverSemana";

describe("resolver siete días desde la fecha indicada", () => {
  it("cruza de mes y resuelve cada origen desde un día que no es lunes", () => {
    const semana = resolverSemana("2026-06-30", [{ dia_semana: 2, tramos: [{ abre: "09:00", cierra: "20:00" }] }], [
      { id: 1, nombre: "Verano", desde: "2026-07-01", hasta: "2026-08-31", activa: true, horario: [] },
    ], [{ id: 1, fecha: "2026-07-02", cerrado: true, motivo: "Festivo", tramos: [] }]);
    expect(semana).toHaveLength(7);
    expect(semana[0].fecha).toBe("2026-06-30");
    expect(semana[6].fecha).toBe("2026-07-06");
    expect(semana.map((dia) => dia.origen)).toEqual(["general", "temporada", "excepcion", "temporada", "temporada", "temporada", "temporada"]);
  });
  it.each(["2026-03-27", "2026-10-23"])("el cambio de hora no repite ni salta días: %s", (desde) => {
    const semana = resolverSemana(desde, [], [], []);
    expect(new Set(semana.map((dia) => dia.fecha)).size).toBe(7);
    expect(semana[6].fecha).toBe(desde === "2026-03-27" ? "2026-04-02" : "2026-10-29");
  });
  it("cruza de año y conserva el 29 de febrero", () => {
    expect(resolverSemana("2026-12-29", [], [], [])[6].fecha).toBe("2027-01-04");
    expect(resolverSemana("2028-02-27", [], [], [])[2].fecha).toBe("2028-02-29");
  });
});
