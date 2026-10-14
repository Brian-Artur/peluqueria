import { describe, it, expect } from "vitest";
import type { DiaResuelto } from "@peluqueria/compartido";
import { diasDeLaSemana } from "./fechas";
import { fechaDeDia } from "./horario";
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

const horario: DiaResuelto[] = diasDeLaSemana(new Date(2026, 9, 12)).map((dia) => ({
  fecha: fechaDeDia(dia),
  tramos: [2, 3, 4, 5, 6].includes(dia.getDay()) ? [{ abre: "09:00", cierra: "20:00" }] : [],
  origen: "general", motivo: null, temporada_nombre: null,
}));

describe("diasVisibles", () => {
  it("respeta una apertura excepcional y el cierre de una temporada", () => {
    const resueltos: DiaResuelto[] = [
      { fecha: "2026-10-18", tramos: [{ abre: "08:00", cierra: "15:00" }], origen: "excepcion", motivo: "Bodas", temporada_nombre: null },
      { fecha: "2026-10-13", tramos: [], origen: "temporada", motivo: null, temporada_nombre: "Verano" },
    ];
    expect(diasVisibles(new Date(2026, 9, 12), [], false, resueltos).map((dia) => dia.getDay())).toEqual([0]);
  });

  it("devuelve una lista vacía para una semana cerrada sin citas", () => {
    expect(diasVisibles(new Date(2026, 9, 12), [], false, [])).toEqual([]);
  });
  it("muestra cinco días de martes a sábado si no hay citas en lunes ni domingo", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [citaEnDia(14)], false, horario);

    expect(dias.map((dia) => dia.getDay())).toEqual([2, 3, 4, 5, 6]);
  });

  it("muestra seis días de lunes a sábado si hay una cita el lunes", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [citaEnDia(12)], false, horario);

    expect(dias.map((dia) => dia.getDay())).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("mantiene visible el lunes aunque su cita esté cancelada", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [citaEnDia(12, "cancelada")], false, horario);

    expect(dias.map((dia) => dia.getDay())).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("muestra los siete días en orden de lunes a domingo al mostrar cerrados", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [], true, horario);

    expect(dias.map((dia) => dia.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it("mantiene el orden de lunes a domingo aunque las citas estén en orden inverso", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [citaEnDia(18), citaEnDia(12)], false, horario);

    expect(dias.map((dia) => dia.getDay())).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it("ignora las citas del lunes y domingo de otras semanas", () => {
    const dias = diasVisibles(new Date(2026, 9, 12), [citaEnDia(5), citaEnDia(25)], false, horario);

    expect(dias.map((dia) => dia.getDay())).toEqual([2, 3, 4, 5, 6]);
  });
});
