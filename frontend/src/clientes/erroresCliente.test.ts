import { describe, expect, it } from "vitest";
import { esquemaDatosCliente } from "@peluqueria/compartido";
import { erroresDeCliente } from "./erroresCliente";

describe("erroresDeCliente", () => {
  it("sitúa los mensajes del contrato en sus campos", () => {
    const resultado = esquemaDatosCliente.safeParse({
      nombre: " ", telefono: "1".repeat(21), email: "incorrecto", notas: "a".repeat(1001),
    });
    if (resultado.success) throw new Error("Se esperaba un formulario inválido");

    expect(erroresDeCliente(resultado.error.issues)).toEqual({
      nombre: "El nombre es obligatorio",
      telefono: "El teléfono no puede superar los 20 caracteres",
      email: "El email no es válido",
      notas: "Las notas no pueden superar los 1000 caracteres",
    });
  });

  it("conserva el primer mensaje cuando un campo tiene varios errores", () => {
    expect(erroresDeCliente([
      { code: "custom", path: ["email"], message: "Primer error" },
      { code: "custom", path: ["email"], message: "Segundo error" },
    ])).toEqual({ email: "Primer error" });
  });

  it("ignora errores del objeto y de campos ajenos al formulario", () => {
    expect(erroresDeCliente([
      { code: "custom", path: [], message: "Error general" },
      { code: "custom", path: ["otro"], message: "Error ajeno" },
    ])).toEqual({});
    expect(erroresDeCliente([])).toEqual({});
  });
});
