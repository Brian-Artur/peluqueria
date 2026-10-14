import { describe, expect, it } from "vitest";
import { ErrorConflicto } from "../errores";
import { traducirErrorFechaDuplicada } from "./traducirErrorFechaDuplicada";

describe("fecha de excepción duplicada", () => {
  it("traduce ER_DUP_ENTRY a 409", () => {
    expect(() => traducirErrorFechaDuplicada({ code: "ER_DUP_ENTRY" })).toThrow(new ErrorConflicto("Ya existe una excepción para esa fecha"));
  });
  it("conserva cualquier otro error", () => {
    const error = new Error("Sin conexión");
    try {
      traducirErrorFechaDuplicada(error);
    } catch (recibido) {
      expect(recibido).toBe(error);
      return;
    }
    throw new Error("Debía propagar el error");
  });
});
