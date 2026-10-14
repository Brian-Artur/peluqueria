import { describe, expect, it } from "vitest";
import { ErrorConflicto } from "../errores";
import { validarZonaHoraria } from "./validarZonaHoraria";

describe("zona horaria del salón", () => {
  it.each(["Europe/Madrid", "America/New_York"])("admite %s del catálogo de Intl", (zona) => {
    expect(() => validarZonaHoraria(zona)).not.toThrow();
  });
  it.each(["Madrid", "Europe/Inventada", "", "europe/madrid"])("rechaza %j con 409", (zona) => {
    expect(() => validarZonaHoraria(zona)).toThrow(ErrorConflicto);
  });
});
