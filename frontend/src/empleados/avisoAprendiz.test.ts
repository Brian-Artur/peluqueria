import { describe, expect, it } from "vitest";
import { esquemaDificultad, esquemaNivel } from "@peluqueria/compartido";
import { necesitaAvisoAprendiz } from "./avisoAprendiz";

describe("aviso de dificultad para un aprendiz", () => {
  it("avisa solo de un aprendiz en dificultad alta, sin impedir elegirlo", () => {
    for (const dificultad of esquemaDificultad.options) {
      for (const nivel of [...esquemaNivel.options, null]) {
        expect(necesitaAvisoAprendiz(nivel, dificultad)).toBe(nivel === "aprendiz" && dificultad === "alta");
      }
    }
  });
});
