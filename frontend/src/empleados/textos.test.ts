import { describe, expect, it } from "vitest";
import { textoNumeroCompetencias } from "./textos";

describe("textoNumeroCompetencias", () => {
  it("usa el singular para una competencia", () => {
    expect(textoNumeroCompetencias(1)).toBe("1 competencia");
  });

  it("usa el plural para cero o varias", () => {
    expect(textoNumeroCompetencias(0)).toBe("0 competencias");
    expect(textoNumeroCompetencias(3)).toBe("3 competencias");
  });
});
