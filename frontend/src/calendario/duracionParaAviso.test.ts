import { expect, it } from "vitest";
import type { Cita, Servicio } from "@peluqueria/compartido";
import { duracionParaAviso } from "./duracionParaAviso";

const servicio: Servicio = {
  id: 1, nombre: "Corte", categoria_id: null, categoria_nombre: null, tipo_recurso_id: null,
  tipo_recurso_nombre: null, activo: true, duracion_min: 30, margen_min: 10, dificultad: "baja", precio: "15.00",
};
const cita: Cita = {
  id: 1, cliente_id: 1, cliente_nombre: "Ana", servicio_id: 1, servicio_nombre: "Corte",
  inicio: "2026-10-12T08:00:00Z", fin: "2026-10-12T08:45:00Z", estado: "reservada",
};

it("usa la duración vigente del servicio, también al mover, igual que la API", () => {
  expect(duracionParaAviso(servicio, null)).toBe(30);
  expect(duracionParaAviso(servicio, cita)).toBe(30);
});

it("conserva la duración de la cita si el catálogo aún no está disponible", () => {
  expect(duracionParaAviso(null, cita)).toBe(45);
  expect(duracionParaAviso(null, null)).toBe(5);
});
