import { describe, expect, it } from "vitest";
import { esquemaCategoria, esquemaDatosCategoria } from "./categoria";

describe("contratos de categorías", () => {
  it("recorta el nombre y acepta categorías desactivadas", () => {
    expect(esquemaDatosCategoria.parse({ nombre: "  Pelo  ", activa: false }))
      .toEqual({ nombre: "Pelo", activa: false });
    expect(esquemaCategoria.parse({ id: 1, nombre: "Pelo", activa: true }).id).toBe(1);
  });

  it("acepta el límite de 60 caracteres", () => {
    expect(esquemaDatosCategoria.safeParse({ nombre: "a".repeat(60), activa: true }).success).toBe(true);
  });

  it.each(["", "  ", "a".repeat(61), null, 12])("rechaza el nombre %j", (nombre) => {
    expect(esquemaDatosCategoria.safeParse({ nombre, activa: true }).success).toBe(false);
  });

  it.each([undefined, 1, "true", null])("rechaza activa %j", (activa) => {
    expect(esquemaDatosCategoria.safeParse({ nombre: "Pelo", activa }).success).toBe(false);
  });
});
