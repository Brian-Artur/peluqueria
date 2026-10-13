import { describe, it, expect } from "vitest";
import { ordenarArchivosMigracion } from "./archivosMigracion";

describe("ordenarArchivosMigracion", () => {
  it("filtra los nombres inválidos y ordena las migraciones por número", () => {
    const nombres = ["000-a.sql", "010-b.sql", "002-c.sql", "notas.txt", "3-mal.sql", "004-Mayus.sql"];

    expect(ordenarArchivosMigracion(nombres)).toEqual(["000-a.sql", "002-c.sql", "010-b.sql"]);
  });

  it("rechaza dos archivos con el mismo número de migración", () => {
    expect(() => ordenarArchivosMigracion(["002-c.sql", "000-a.sql", "002-otra.sql"]))
      .toThrow("Número de migración duplicado: 002");
  });
});
