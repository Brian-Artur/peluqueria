import { describe, expect, it } from "vitest";
import { esquemaDatosServicio, esquemaServicio } from "./servicio";

const datos = { nombre: "Corte", categoria_id: null, duracion_min: 30, margen_min: 5, dificultad: "media" as const, precio: "15.00", activo: true };

describe("contratos de servicios", () => {
  it("acepta y recorta los datos con o sin categoría", () => {
    expect(esquemaDatosServicio.parse({ ...datos, nombre: "  Corte  ", precio: " 15.00 " })).toEqual(datos);
    expect(esquemaDatosServicio.parse({ ...datos, categoria_id: 2 }).categoria_id).toBe(2);
    expect(esquemaServicio.parse({ ...datos, id: 1, categoria_nombre: null }).categoria_nombre).toBeNull();
    expect(esquemaServicio.parse({ ...datos, id: 1, categoria_id: 2, categoria_nombre: "Pelo", activo: false }).activo).toBe(false);
  });

  it.each([5, 45, 600])("acepta la duración %i", (duracion_min) => {
    expect(esquemaDatosServicio.safeParse({ ...datos, duracion_min }).success).toBe(true);
  });

  it.each([0, 5, 60])("acepta el margen %i en entrada y respuesta", (margen_min) => {
    expect(esquemaDatosServicio.safeParse({ ...datos, margen_min }).success).toBe(true);
    expect(esquemaServicio.safeParse({ ...datos, id: 1, categoria_nombre: null, margen_min }).success).toBe(true);
  });

  it.each([-5, 1, 65, 5.5, "5", null, undefined])("rechaza el margen %j", (margen_min) => {
    expect(esquemaDatosServicio.safeParse({ ...datos, margen_min }).success).toBe(false);
    expect(esquemaServicio.safeParse({ ...datos, id: 1, categoria_nombre: null, margen_min }).success).toBe(false);
  });

  it.each(["baja", "media", "alta"])("acepta dificultad %s", (dificultad) => {
    expect(esquemaDatosServicio.safeParse({ ...datos, dificultad }).success).toBe(true);
    expect(esquemaServicio.safeParse({ ...datos, id: 1, categoria_nombre: null, dificultad }).success).toBe(true);
  });

  it.each(["muy alta", "", null, undefined])("rechaza dificultad %j", (dificultad) => {
    expect(esquemaDatosServicio.safeParse({ ...datos, dificultad }).success).toBe(false);
    expect(esquemaServicio.safeParse({ ...datos, id: 1, categoria_nombre: null, dificultad }).success).toBe(false);
  });

  it.each([0, 4, 7, 45.5, 605, "30", null])("rechaza la duración %j", (duracion_min) => {
    expect(esquemaDatosServicio.safeParse({ ...datos, duracion_min }).success).toBe(false);
  });

  it("explica por qué rechaza duraciones fuera de las franjas", () => {
    const resultado = esquemaDatosServicio.safeParse({ ...datos, duracion_min: 31 });
    if (resultado.success) throw new Error("Debería rechazar 31 minutos");
    expect(resultado.error.issues[0].message).toBe("La duración debe ser múltiplo de 5 minutos");
  });

  it.each(["0", "0.00", "20", "20.5", "20.50"])("acepta el precio %s como texto", (precio) => {
    expect(esquemaDatosServicio.parse({ ...datos, precio }).precio).toBe(precio);
  });

  it.each(["", "-1", "20,00", "1.234", "1e2", ".50", "20.", "Infinity", "NaN", 20, null])("rechaza el precio %j", (precio) => {
    expect(esquemaDatosServicio.safeParse({ ...datos, precio }).success).toBe(false);
  });

  it.each([0, -1, 1.5, "2", undefined])("rechaza la categoría %j", (categoria_id) => {
    expect(esquemaDatosServicio.safeParse({ ...datos, categoria_id }).success).toBe(false);
  });

  it("valida el nombre y el estado", () => {
    expect(esquemaDatosServicio.safeParse({ ...datos, nombre: "a".repeat(120), activo: false }).success).toBe(true);
    for (const nombre of ["", "  ", "a".repeat(121)]) {
      expect(esquemaDatosServicio.safeParse({ ...datos, nombre }).success).toBe(false);
    }
    expect(esquemaDatosServicio.safeParse({ ...datos, activo: 1 }).success).toBe(false);
    expect(esquemaDatosServicio.safeParse(null).success).toBe(false);
  });
});
