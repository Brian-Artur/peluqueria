import { describe, expect, it } from "vitest";
import { formatearPrecio } from "./formatearPrecio";

describe("precio del catálogo en euros", () => {
  it.each([["20.00", "20,00 €"], ["0", "0,00 €"], ["15.5", "15,50 €"]])(
    "formatea el texto %s como %s", (precio, esperado) => {
      expect(formatearPrecio(precio)).toBe(esperado);
    }
  );
});
