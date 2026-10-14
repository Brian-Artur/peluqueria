import { describe, expect, it } from "vitest";
import type { Recurso } from "@peluqueria/compartido";
import { agruparRecursos } from "./agruparRecursos";

function recurso(id: number, nombre: string, tipo_recurso_id: number, tipo_recurso_nombre: string, activo = true): Recurso {
  return { id, nombre, tipo_recurso_id, tipo_recurso_nombre, activo, fuera_de_servicio: false, motivo: null };
}

const recursos = [
  recurso(1, "Butaca 10", 2, "Butaca"),
  recurso(2, "Camilla 1", 1, "Camilla"),
  recurso(3, "Butaca 2", 2, "Butaca"),
  recurso(4, "Mesa 1", 3, "Mesa de uñas", false),
];

describe("agrupar recursos por tipo", () => {
  it("ordena tipos y nombres con números sin alterar la lista original", () => {
    const copia = structuredClone(recursos);
    const grupos = agruparRecursos(recursos);
    expect(grupos.map((grupo) => grupo.nombre)).toEqual(["Butaca", "Camilla"]);
    expect(grupos[0].recursos.map((elemento) => elemento.id)).toEqual([3, 1]);
    expect(recursos).toEqual(copia);
  });

  it("oculta bajas por defecto y puede incluirlas sin mezclar tipos", () => {
    const grupos = agruparRecursos(recursos, true);
    expect(grupos).toHaveLength(3);
    expect(grupos[2]).toEqual({ tipoId: 3, nombre: "Mesa de uñas", recursos: [recursos[3]] });
  });

  it("conserva recursos fuera de servicio con el motivo", () => {
    const roto = { ...recursos[0], fuera_de_servicio: true, motivo: "Elevador roto" };
    expect(agruparRecursos([roto])[0].recursos).toEqual([roto]);
  });

  it("devuelve una lista vacía si no hay recursos visibles", () => {
    expect(agruparRecursos([])).toEqual([]);
    expect(agruparRecursos([recursos[3]])).toEqual([]);
  });

  it("agrupa por id y desempata nombres iguales por id", () => {
    const primero = recurso(5, "Butaca 1", 2, "Butaca");
    const segundo = recurso(6, "Butaca 1", 2, "Butaca");
    const otroTipo = recurso(7, "Butaca 1", 4, "Butaca");
    expect(agruparRecursos([otroTipo, segundo, primero])).toEqual([
      { tipoId: 2, nombre: "Butaca", recursos: [primero, segundo] },
      { tipoId: 4, nombre: "Butaca", recursos: [otroTipo] },
    ]);
  });
});
