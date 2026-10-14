import { describe, expect, it } from "vitest";
import type { DiaResuelto, Tramo } from "@peluqueria/compartido";
import { citaDentroDeHorario, fechaDeDia, intervaloEnTramos, rangoDeHorario } from "./horario";

function dia(tramos: Tramo[], fecha = "2026-10-12"): DiaResuelto {
  return { fecha, tramos, origen: "general", motivo: null, temporada_nombre: null };
}

describe("rangoDeHorario", () => {
  it("usa 9–20 cuando toda la semana está cerrada", () => {
    expect(rangoDeHorario([dia([])])).toEqual({ horaInicio: 9, horaFin: 20, franjas: 132 });
  });
  it("calcula 84 franjas para 8–15", () => {
    expect(rangoDeHorario([dia([{ abre: "08:00", cierra: "15:00" }])])).toEqual({ horaInicio: 8, horaFin: 15, franjas: 84 });
  });
  it("redondea 9:30–20:00 a 9–20", () => {
    expect(rangoDeHorario([dia([{ abre: "09:30", cierra: "20:00" }])])).toEqual({ horaInicio: 9, horaFin: 20, franjas: 132 });
  });
  it("recorre todos los días y todos sus tramos", () => {
    expect(rangoDeHorario([
      dia([{ abre: "10:00", cierra: "13:00" }, { abre: "16:00", cierra: "20:05" }]),
      dia([{ abre: "08:55", cierra: "15:00" }], "2026-10-13"),
    ])).toEqual({ horaInicio: 8, horaFin: 21, franjas: 156 });
  });
  it("permite el rango 0–24 para un cierre a las 23:55", () => {
    expect(rangoDeHorario([dia([{ abre: "00:00", cierra: "23:55" }])])).toEqual({ horaInicio: 0, horaFin: 24, franjas: 288 });
  });
});

describe("citaDentroDeHorario", () => {
  const dias = [dia([{ abre: "09:30", cierra: "13:00" }, { abre: "16:00", cierra: "20:00" }])];
  it.each([
    [9, 30, 30, true], [9, 25, 30, false], [12, 30, 30, true],
    [12, 30, 35, false], [13, 0, 30, false], [12, 0, 300, false],
    [19, 30, 30, true], [20, 0, 5, false], [23, 30, 60, false],
  ])("comprueba inicio %i:%i y duración %i", (hora, minuto, duracion, esperado) => {
    expect(citaDentroDeHorario(new Date(2026, 9, 12, hora, minuto), duracion, dias)).toBe(esperado);
  });
  it("no considera abierto otro día ni un día cerrado", () => {
    expect(citaDentroDeHorario(new Date(2026, 9, 13, 10), 30, dias)).toBe(false);
    expect(citaDentroDeHorario(new Date(2026, 9, 12, 10), 30, [dia([])])).toBe(false);
  });
  it("une tramos contiguos pero rechaza duraciones inválidas", () => {
    const tramos = [{ abre: "09:00", cierra: "10:00" }, { abre: "10:00", cierra: "11:00" }];
    expect(intervaloEnTramos(570, 60, tramos)).toBe(true);
    expect(intervaloEnTramos(570, 0, tramos)).toBe(false);
    expect(intervaloEnTramos(570, NaN, tramos)).toBe(false);
  });
  it("incluye los segundos al comprobar si se rebasa el cierre", () => {
    expect(citaDentroDeHorario(new Date(2026, 9, 12, 19, 30, 1), 30, dias)).toBe(false);
  });
});

describe("fechaDeDia", () => {
  it("formatea el día local sin convertirlo a UTC", () => {
    expect(fechaDeDia(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
