import { describe, expect, it } from "vitest";
import { ErrorConflicto } from "../errores";
import { validarTemporada } from "./validarTemporada";

const datos = { nombre: "Verano", desde: "2026-07-01", hasta: "2026-08-31", activa: true };
const actual = { ...datos, id: 1, horario: [] };

describe("reglas de temporadas (409)", () => {
  it.each([true, false])("rechaza el rango invertido incluso con activa=%s", (activa) => {
    expect(() => validarTemporada({ ...datos, desde: "2026-09-01", activa }, [])).toThrow(ErrorConflicto);
  });
  it("admite una temporada de un solo día", () => {
    expect(() => validarTemporada({ ...datos, hasta: datos.desde }, [])).not.toThrow();
  });
  it.each([
    ["2026-06-01", "2026-07-01"], ["2026-08-31", "2026-09-01"],
    ["2026-07-15", "2026-07-20"], ["2026-06-01", "2026-09-01"], ["2026-07-01", "2026-08-31"],
  ])("rechaza solapamiento inclusivo %s–%s", (desde, hasta) => {
    expect(() => validarTemporada({ ...datos, desde, hasta }, [actual])).toThrow(ErrorConflicto);
  });
  it("admite rangos adyacentes y permite editar la propia temporada", () => {
    expect(() => validarTemporada({ ...datos, desde: "2026-09-01", hasta: "2026-09-30" }, [actual])).not.toThrow();
    expect(() => validarTemporada(datos, [actual], 1)).not.toThrow();
  });
  it("ignora la inactiva, permite desactivar y vuelve a comprobar al activar", () => {
    expect(() => validarTemporada(datos, [{ ...actual, activa: false }])).not.toThrow();
    expect(() => validarTemporada({ ...datos, activa: false }, [actual])).not.toThrow();
    expect(() => validarTemporada(datos, [actual])).toThrow(ErrorConflicto);
  });
});
