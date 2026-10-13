import { describe, expect, it } from "vitest";
import { patronBusqueda } from "./patronBusqueda";

describe("patronBusqueda", () => {
  it.each([
    { texto: "Ana", patron: "%Ana%" },
    { texto: "", patron: "%%" },
    { texto: "100%", patron: "%100!%%" },
    { texto: "ana_garcia", patron: "%ana!_garcia%" },
    { texto: "¡Hola!", patron: "%¡Hola!!%" },
    { texto: "!%_", patron: "%!!!%!_%" },
    { texto: "O'Connor\\", patron: "%O'Connor\\%" },
  ])("busca literalmente $texto", ({ texto, patron }) => {
    expect(patronBusqueda(texto)).toBe(patron);
  });
});
