import { describe, expect, it } from "vitest";
import { opcionesMinutos } from "./opcionesMinutos";

describe("opciones de minutos", () => {
  it("incluye los límites del margen y avanza de cinco en cinco", () => {
    expect(opcionesMinutos(0, 60)).toEqual([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]);
  });
  it("ofrece duraciones desde 5 hasta 600 sin incluir cero", () => {
    const duraciones = opcionesMinutos(5, 600);
    expect(duraciones).toHaveLength(120);
    expect(duraciones[0]).toBe(5);
    expect(duraciones.at(-1)).toBe(600);
    expect(duraciones.every((minutos) => minutos % 5 === 0)).toBe(true);
  });
});
