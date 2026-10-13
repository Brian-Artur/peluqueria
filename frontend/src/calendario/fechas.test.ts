import { describe, it, expect } from "vitest";
import {
  lunesDeEstaSemana,
  sumarDias,
  diasDeLaSemana,
  mismoDia,
  numeroSemanaISO,
  horaCorta,
  diasDelMes,
} from "./fechas";

describe("la zona horaria de los tests", () => {
  it("usa la hora de verano de Europe/Madrid", () => {
    expect(new Date("2026-07-06T08:00:00Z").getHours()).toBe(10);
  });
});

describe("lunesDeEstaSemana", () => {
  it("devuelve el lunes de esa semana si es miércoles", () => {
    expect(lunesDeEstaSemana(new Date(2026, 9, 14, 12)))
      .toEqual(new Date(2026, 9, 12));
  });

  it("devuelve el lunes anterior si es domingo", () => {
    expect(lunesDeEstaSemana(new Date(2026, 9, 18, 12)))
      .toEqual(new Date(2026, 9, 12));
  });

  it("devuelve el mismo día si es lunes", () => {
    expect(lunesDeEstaSemana(new Date(2026, 9, 12)))
      .toEqual(new Date(2026, 9, 12));
  });

  it("devuelve el lunes a medianoche sin segundos ni milisegundos", () => {
    const lunes = lunesDeEstaSemana(new Date(2026, 9, 14, 19, 55, 30, 500));

    expect(lunes).toEqual(new Date(2026, 9, 12));
    expect([lunes.getHours(), lunes.getMinutes(), lunes.getSeconds(), lunes.getMilliseconds()])
      .toEqual([0, 0, 0, 0]);
  });
});

describe("sumarDias", () => {
  it("mantiene la medianoche al cruzar el cambio de hora del 25 de octubre de 2026", () => {
    const inicio = new Date(2026, 9, 25);
    const siguiente = sumarDias(inicio, 1);

    expect(siguiente).toEqual(new Date(2026, 9, 26));
    expect(siguiente.getHours()).toBe(0);
    expect(inicio.getTimezoneOffset()).toBe(-120);
    expect(siguiente.getTimezoneOffset()).toBe(-60);
    expect(siguiente.getTime() - inicio.getTime()).toBe(25 * 60 * 60 * 1000);
  });

  it("crea otra fecha sin mutar el argumento", () => {
    const inicio = new Date(2026, 9, 12, 9, 5);
    const instanteOriginal = inicio.getTime();
    const siguiente = sumarDias(inicio, 1);

    expect(siguiente).not.toBe(inicio);
    expect(siguiente).toEqual(new Date(2026, 9, 13, 9, 5));
    expect(inicio.getTime()).toBe(instanteOriginal);
  });
});

describe("diasDeLaSemana", () => {
  it("devuelve siete días consecutivos de lunes a domingo", () => {
    expect(diasDeLaSemana(new Date(2026, 9, 12))).toEqual([
      new Date(2026, 9, 12),
      new Date(2026, 9, 13),
      new Date(2026, 9, 14),
      new Date(2026, 9, 15),
      new Date(2026, 9, 16),
      new Date(2026, 9, 17),
      new Date(2026, 9, 18),
    ]);
  });
});

describe("mismoDia", () => {
  it("considera iguales dos fechas del mismo día con horas distintas", () => {
    expect(mismoDia(new Date(2026, 9, 12, 0), new Date(2026, 9, 12, 23, 59))).toBe(true);
  });

  it.each([
    { nombre: "días", otra: new Date(2026, 9, 13) },
    { nombre: "meses", otra: new Date(2026, 10, 12) },
    { nombre: "años", otra: new Date(2027, 9, 12) },
  ])("distingue fechas con $nombre distintos", ({ otra }) => {
    expect(mismoDia(new Date(2026, 9, 12), otra)).toBe(false);
  });
});

describe("numeroSemanaISO", () => {
  it.each([
    { fecha: "2026-01-01", semana: 1 },
    { fecha: "2026-10-12", semana: 42 },
    { fecha: "2026-12-31", semana: 53 },
    { fecha: "2027-01-01", semana: 53 },
    { fecha: "2027-01-04", semana: 1 },
  ])("devuelve la semana $semana para el día $fecha", ({ fecha, semana }) => {
    expect(numeroSemanaISO(new Date(`${fecha}T12:00:00`))).toBe(semana);
  });
});

describe("horaCorta", () => {
  it("rellena con ceros la hora 09:05", () => {
    expect(horaCorta(new Date(2026, 9, 12, 9, 5))).toBe("09:05");
  });

  it("devuelve la hora 19:55", () => {
    expect(horaCorta(new Date(2026, 9, 12, 19, 55))).toBe("19:55");
  });
});

describe("diasDelMes", () => {
  it.each([
    { nombre: "octubre de 2026", anio: 2026, mes: 9, huecos: 3, cantidad: 31 },
    { nombre: "febrero de 2027", anio: 2027, mes: 1, huecos: 0, cantidad: 28 },
    { nombre: "febrero de 2028", anio: 2028, mes: 1, huecos: 1, cantidad: 29 },
  ])("devuelve $huecos huecos y $cantidad días para $nombre", ({ anio, mes, huecos, cantidad }) => {
    const dias = diasDelMes(new Date(anio, mes, 15));
    const fechasEsperadas = Array.from({ length: cantidad }, (_, indice) => new Date(anio, mes, indice + 1));

    expect(dias).toHaveLength(huecos + cantidad);
    expect(dias.slice(0, huecos)).toEqual(Array(huecos).fill(null));
    expect(dias.slice(huecos)).toEqual(fechasEsperadas);
  });
});
