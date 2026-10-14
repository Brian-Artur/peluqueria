import { describe, expect, it } from "vitest";
import { ErrorConflicto } from "../errores";
import { traducirErrorNombreDuplicado } from "./traducirErrorNombreDuplicado";

describe("traducir errores de nombre duplicado", () => {
  it("convierte ER_DUP_ENTRY a conflicto con el mensaje del caso de uso", () => {
    const error = { code: "ER_DUP_ENTRY" };
    expect(() => traducirErrorNombreDuplicado(error, "Nombre repetido")).toThrow(ErrorConflicto);
    expect(() => traducirErrorNombreDuplicado(error, "Nombre repetido")).toThrow("Nombre repetido");
  });
  it.each([null, undefined, "fallo", 1, { code: "ER_NO_SUCH_TABLE" }, new Error("Conexión")])(
    "conserva el error original %j", (error) => {
      let recibido: unknown;
      try {
        traducirErrorNombreDuplicado(error, "Nombre repetido");
      } catch (fallo) {
        recibido = fallo;
      }
      expect(recibido).toBe(error);
    },
  );
});
