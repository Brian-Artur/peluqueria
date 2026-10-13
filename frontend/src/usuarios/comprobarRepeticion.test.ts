import { describe, expect, it } from "vitest";
import { comprobarRepeticion } from "./comprobarRepeticion";

describe("confirmar una contraseña", () => {
  it("admite contraseñas idénticas", () => {
    expect(comprobarRepeticion(" clave12 ", " clave12 ")).toBeNull();
  });

  it.each([["demo1234", "demo1235"], ["Clave123", "clave123"], [" clave12 ", "clave12"], ["demo1234", ""]])(
    "compara literalmente %j y %j", (contrasena, repetida) => {
      expect(comprobarRepeticion(contrasena, repetida)).toBe("Las contraseñas no coinciden");
    }
  );
});
