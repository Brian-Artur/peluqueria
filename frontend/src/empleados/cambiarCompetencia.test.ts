import { describe, expect, it } from "vitest";
import type { Competencias } from "@peluqueria/compartido";
import { cambiarCompetencia } from "./cambiarCompetencia";

describe("edición de una competencia", () => {
  const originales: Competencias = [{ servicio_id: 1, nivel: "aprendiz" }, { servicio_id: 9, nivel: "experto" }];
  it("cambia el nivel sin duplicados ni alterar otros servicios, incluso si no se muestran", () => {
    expect(cambiarCompetencia(originales, 1, "autonomo"))
      .toEqual([{ servicio_id: 9, nivel: "experto" }, { servicio_id: 1, nivel: "autonomo" }]);
    expect(originales[0].nivel).toBe("aprendiz");
  });
  it("permite quitar una competencia y vaciar la lista", () => {
    expect(cambiarCompetencia(originales, 1, null)).toEqual([{ servicio_id: 9, nivel: "experto" }]);
    expect(cambiarCompetencia([{ servicio_id: 1, nivel: "experto" }], 1, null)).toEqual([]);
  });
  it("añade un servicio nuevo sin perder el resto", () => {
    expect(cambiarCompetencia(originales, 3, "aprendiz"))
      .toEqual([...originales, { servicio_id: 3, nivel: "aprendiz" }]);
  });
});
