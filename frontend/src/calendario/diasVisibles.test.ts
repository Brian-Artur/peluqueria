import { describe, it, expect } from "vitest";
import type { Cita } from "../tipos";
import { diasVisibles } from "./diasVisibles";

function citaEnDia(dia: number, estado: Cita["estado"] = "reservada"): Cita {
  return {
    id: dia,
    inicio: new Date(2026, 9, dia, 10).toISOString(),
    fin: new Date(2026, 9, dia, 11).toISOString(),
    estado,
    cliente_id: 1,
    cliente_nombre: "Ana",
    servicio_id: 1,
    servicio_nombre: "Corte",
  };
}

describe("diasVisibles", () => {
  it("muestra cinco días de martes a sábado si no hay citas en lunes ni domingo", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [citaEnDia(14)], false);

    expect(dias.map((dia) => dia.getDay())).toEqual([2, 3, 4, 5, 6]);
  });

  it("muestra seis días de lunes a sábado si hay una cita el lunes", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [citaEnDia(12)], false);

    expect(dias.map((dia) => dia.getDay())).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("mantiene visible el lunes aunque su cita esté cancelada", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [citaEnDia(12, "cancelada")], false);

    expect(dias.map((dia) => dia.getDay())).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("muestra los siete días en orden de lunes a domingo al mostrar cerrados", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [], true);

    expect(dias.map((dia) => dia.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it("mantiene el orden de lunes a domingo aunque las citas estén en orden inverso", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [citaEnDia(18), citaEnDia(12)], false);

    expect(dias.map((dia) => dia.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it("ignora las citas del lunes y domingo de otras semanas", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [citaEnDia(5), citaEnDia(25)], false);

    expect(dias.map((dia) => dia.getDay())).toEqual([2, 3, 4, 5, 6]);
  });
});
