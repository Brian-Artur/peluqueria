import { describe, expect, it } from "vitest";
import { patronBusqueda, patronBusquedaTelefono } from "./patronBusqueda";

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

describe("patronBusquedaTelefono", () => {
  it.each([
    { texto: "612 345", patron: "%612345%" },
    { texto: " +34 612 345 678 ", patron: "%+34612345678%" },
    { texto: "612\t345", patron: "%612345%" },
    { texto: "612 %_!", patron: "%612!%!_!!%" },
  ])("quita espacios y escapa $texto", ({ texto, patron }) => {
    expect(patronBusquedaTelefono(texto)).toBe(patron);
  });
});
