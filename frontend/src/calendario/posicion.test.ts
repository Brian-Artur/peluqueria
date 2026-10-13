import { describe, it, expect } from "vitest";
import { columnaDeFecha, filaDeHora, franjaEnPosicion } from "./posicion";

describe("columnaDeFecha", () => {
  it.each([
    { dia: 13, columna: 2 },
    { dia: 14, columna: 3 },
    { dia: 15, columna: 4 },
  ])("devuelve la columna $columna para el día visible $dia", ({ dia, columna }) => {
    const visibles = [new Date(2026, 9, 13), new Date(2026, 9, 14), new Date(2026, 9, 15)];

    expect(columnaDeFecha(new Date(2026, 9, dia, 19, 55), visibles)).toBe(columna);
  });

  it("devuelve null si el día no es visible", () => {
    expect(columnaDeFecha(new Date(2026, 9, 12), [new Date(2026, 9, 13)])).toBeNull();
  });
});

describe("filaDeHora", () => {
  it.each([
    { hora: 9, minuto: 0, fila: 2 },
    { hora: 9, minuto: 5, fila: 3 },
    { hora: 19, minuto: 55, fila: 133 },
  ])("devuelve la fila $fila a las $hora horas y $minuto minutos", ({ hora, minuto, fila }) => {
    expect(filaDeHora(new Date(2026, 9, 12, hora, minuto))).toBe(fila);
  });
});

describe("franjaEnPosicion", () => {
  it("devuelve la franja 0 arriba del todo", () => {
    expect(franjaEnPosicion(0, 54)).toBe(0);
  });

  it("devuelve la franja 8 al recorrer el 70 % de una celda de 54 píxeles", () => {
    expect(franjaEnPosicion(0.7 * 54, 54)).toBe(8);
  });

  it("devuelve la franja 11 abajo del todo", () => {
    expect(franjaEnPosicion(54, 54)).toBe(11);
  });

  it("limita a la franja 11 una posición fuera por abajo", () => {
    expect(franjaEnPosicion(70, 54)).toBe(11);
  });

  it("limita a la franja 0 un desplazamiento negativo", () => {
    expect(franjaEnPosicion(-10, 54)).toBe(0);
  });
});
