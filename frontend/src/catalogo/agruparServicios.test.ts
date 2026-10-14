import { describe, expect, it } from "vitest";
import type { Servicio } from "@peluqueria/compartido";
import { agruparServicios } from "./agruparServicios";

function servicio(id: number, nombre: string, categoria_id: number | null, categoria_nombre: string | null, activo = true): Servicio {
  return { id, nombre, tipo_recurso_id: null, tipo_recurso_nombre: null, categoria_id, categoria_nombre, activo, duracion_min: 30, margen_min: 0, dificultad: "media", precio: "15.00" };
}

describe("servicios agrupados por categorías de datos", () => {
  it("ordena grupos y filas en español y deja Sin categoría al final", () => {
    const entrada = [
      servicio(1, "Sin clasificar", null, null),
      servicio(2, "Zeta", 7, "Uñas"),
      servicio(3, "Corte", 3, "Pelo"),
      servicio(4, "Acrílico", 7, "Uñas", false),
    ];
    const grupos = agruparServicios(entrada);
    expect(grupos.map((grupo) => grupo.nombre)).toEqual(["Pelo", "Uñas", "Sin categoría"]);
    expect(grupos[1].servicios.map((elemento) => elemento.id)).toEqual([4, 2]);
    expect(grupos[1].servicios[0].activo).toBe(false);
    expect(entrada.map((elemento) => elemento.id)).toEqual([1, 2, 3, 4]);
  });

  it("admite una categoría nueva sin modificar el código", () => {
    expect(agruparServicios([servicio(1, "Tratamiento", 20, "Bienestar")])[0].nombre).toBe("Bienestar");
  });

  it("agrupa por id aunque los nombres coincidan", () => {
    expect(agruparServicios([servicio(1, "Uno", 1, "Sin categoría"), servicio(2, "Dos", null, null)]))
      .toHaveLength(2);
  });

  it("acepta listas vacías y listas sin categoría", () => {
    expect(agruparServicios([])).toEqual([]);
    expect(agruparServicios([servicio(1, "Corte", null, null)])[0].categoriaId).toBeNull();
  });
});
