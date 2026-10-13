import { describe, it, expect } from "vitest";
import { inicioEnFranja } from "./inicioEnFranja";

describe("la zona horaria de los tests", () => {
  it("usa la hora de verano de Europe/Madrid", () => {
    expect(new Date("2026-07-06T08:00:00Z").getHours()).toBe(10);
  });
});

describe("inicioEnFranja", () => {
  it("acepta un inicio en una franja de cinco minutos sin segundos ni milisegundos", () => {
    const valor = "2026-07-06T08:05:00.000Z";

    expect(inicioEnFranja.parse(valor)).toBe(valor);
  });

  it.each([
    { motivo: "minutos fuera de franja", valor: "2026-07-06T08:07:00.000Z" },
    { motivo: "segundos distintos de cero", valor: "2026-07-06T08:05:30.000Z" },
    { motivo: "milisegundos distintos de cero", valor: "2026-07-06T08:05:00.500Z" },
    { motivo: "una cadena que no es fecha", valor: "esto no es una fecha" },
  ])("rechaza un inicio con $motivo", ({ valor }) => {
    expect(inicioEnFranja.safeParse(valor).success).toBe(false);
  });
});
