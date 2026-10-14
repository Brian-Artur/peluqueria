import { describe, it, expect } from "vitest";
import { columnaDeFecha, filaDeHora, filasDeCita, franjaEnPosicion } from "./posicion";

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
    expect(filaDeHora(new Date(2026, 9, 12, hora, minuto), 9)).toBe(fila);
  });
});

describe("filaDeHora con otro rango", () => {
  it("sitúa las 8:00 en la primera franja y las 14:55 en la última del rango 8–15", () => {
    expect(filaDeHora(new Date(2026, 9, 12, 8), 8)).toBe(2);
    expect(filaDeHora(new Date(2026, 9, 12, 14, 55), 8)).toBe(85);
  });
});

describe("filasDeCita", () => {
  it("no crea filas implícitas para citas anteriores o posteriores al rango 8–15", () => {
    expect(filasDeCita(new Date(2026, 9, 12, 7), new Date(2026, 9, 12, 8), 8, 84)).toBeNull();
    expect(filasDeCita(new Date(2026, 9, 12, 15), new Date(2026, 9, 12, 16), 8, 84)).toBeNull();
  });
  it("recorta únicamente la parte que se sale del rango", () => {
    expect(filasDeCita(new Date(2026, 9, 12, 7, 30), new Date(2026, 9, 12, 8, 30), 8, 84)).toEqual({ inicio: 2, fin: 8 });
    expect(filasDeCita(new Date(2026, 9, 12, 14, 30), new Date(2026, 9, 12, 15, 30), 8, 84)).toEqual({ inicio: 80, fin: 86 });
  });
  it("calcula el final de una cita que cruza medianoche", () => {
    expect(filasDeCita(new Date(2026, 9, 12, 23, 30), new Date(2026, 9, 13, 0, 30), 0, 288)).toEqual({ inicio: 284, fin: 290 });
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
