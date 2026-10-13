import { describe, expect, it } from "vitest";
import { formatearTelefono, normalizarTelefono, separarTelefono } from "./telefono";

describe("normalizarTelefono", () => {
  it.each(["612 345 678", "612-345-678", "612.345.678"])("normaliza %s de España", (numero) => {
    expect(normalizarTelefono(numero, "ES")).toBe("+34612345678");
  });

  it("acepta un prefijo internacional aunque el país seleccionado sea otro", () => {
    expect(normalizarTelefono("+34 600 111 222", "FR")).toBe("+34600111222");
  });

  it("normaliza un número francés con su prefijo nacional", () => {
    expect(normalizarTelefono("06 12 34 56 78", "FR")).toBe("+33612345678");
  });

  it.each(["", "123", "no es un teléfono", "Llámame al 612 345 678"])("rechaza %j", (numero) => {
    expect(normalizarTelefono(numero, "ES")).toBeNull();
  });
});

describe("formatearTelefono", () => {
  it("agrupa los números españoles de tres en tres", () => {
    expect(formatearTelefono("+34612345678")).toBe("+34 612 345 678");
  });

  it("usa el formato internacional para Francia", () => {
    expect(formatearTelefono("+33612345678")).toBe("+33 6 12 34 56 78");
  });

  it.each(["desconocido", "612345678", ""])("conserva el dato antiguo %j", (numero) => {
    expect(formatearTelefono(numero)).toBe(numero);
  });
});

describe("separarTelefono", () => {
  it.each([
    { numero: "+34612345678", pais: "ES", nacional: "612345678" },
    { numero: "+33612345678", pais: "FR", nacional: "612345678" },
    { numero: "dato antiguo", pais: "ES", nacional: "dato antiguo" },
    { numero: "", pais: "ES", nacional: "" },
  ])("separa $numero sin perder los datos antiguos", ({ numero, pais, nacional }) => {
    expect(separarTelefono(numero)).toEqual({ pais, nacional });
  });
});
