import { expect, it } from "vitest";
import type { Excepcion } from "@peluqueria/compartido";
import { separarExcepciones } from "./ordenarExcepciones";

it("incluye hoy en próximas, ordena las pasadas de reciente a antigua y no cambia la lista original", () => {
  const fechas = ["2026-12-25", "2026-09-01", "2026-10-14", "2026-10-01", "2026-11-02"];
  const excepciones: Excepcion[] = fechas.map((fecha, indice) => ({ id: indice + 1, fecha, cerrado: true, motivo: null, tramos: [] }));
  const { proximas, pasadas } = separarExcepciones(excepciones, "2026-10-14");
  expect(proximas.map((excepcion) => excepcion.fecha)).toEqual(["2026-10-14", "2026-11-02", "2026-12-25"]);
  expect(pasadas.map((excepcion) => excepcion.fecha)).toEqual(["2026-10-01", "2026-09-01"]);
  expect(excepciones.map((excepcion) => excepcion.fecha)).toEqual(fechas);
});
