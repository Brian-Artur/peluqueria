import { describe, expect, it } from "vitest";
import { parsearId } from "./parsearId";

describe("parsear el id de una ruta", () => {
  it("acepta un entero positivo", () => {
    expect(parsearId("12")).toBe(12);
  });

  it.each(["0", "-1", "1.5", "texto", ""])("rechaza un id inválido: %s", (valor) => {
    expect(parsearId(valor)).toBeNull();
  });

  it("rechaza los parámetros de ruta que Express representa como una lista", () => {
    expect(parsearId(["12"])).toBeNull();
  });
});
