import { describe, expect, it } from "vitest";
import type { EmpleadoResumen, Servicio } from "@peluqueria/compartido";
import { construirMatriz } from "./matrizCompetencias";

const empleados: EmpleadoResumen[] = [
  { id: 1, nombre: "Ana", activo: true, telefono: null, email: null, contrato_vigente: "plantilla", num_competencias: 2 },
  { id: 2, nombre: "Eva", activo: false, telefono: null, email: null, contrato_vigente: null, num_competencias: 1 },
];
const servicios: Servicio[] = [
  { id: 1, nombre: "Corte", activo: true, tipo_recurso_id: null, categoria_id: 1, tipo_recurso_nombre: null, categoria_nombre: "Pelo", duracion_min: 30, margen_min: 0, dificultad: "media", precio: "10" },
  { id: 2, nombre: "Color", activo: true, tipo_recurso_id: null, categoria_id: 1, tipo_recurso_nombre: null, categoria_nombre: "Pelo", duracion_min: 30, margen_min: 0, dificultad: "media", precio: "10" },
  { id: 3, nombre: "Uñas", activo: true, tipo_recurso_id: null, categoria_id: null, tipo_recurso_nombre: null, categoria_nombre: null, duracion_min: 30, margen_min: 0, dificultad: "media", precio: "10" },
  { id: 4, nombre: "Antiguo", activo: false, tipo_recurso_id: null, categoria_id: null, tipo_recurso_nombre: null, categoria_nombre: null, duracion_min: 30, margen_min: 0, dificultad: "media", precio: "10" },
];

describe("cuadro de competencias y huecos", () => {
  it("ordena las columnas por categoría y excluye bajas y servicios inactivos", () => {
    const matriz = construirMatriz(empleados, servicios, [
      { empleado_id: 1, servicio_id: 1, nivel: "experto" },
      { empleado_id: 1, servicio_id: 2, nivel: "aprendiz" },
      { empleado_id: 2, servicio_id: 3, nivel: "experto" },
      { empleado_id: 1, servicio_id: 4, nivel: "experto" },
    ]);
    expect(matriz.servicios.map((servicio) => servicio.id)).toEqual([2, 1, 3]);
    expect(matriz.filas.map((fila) => fila.empleado.id)).toEqual([1]);
    expect(matriz.filas[0].niveles).toEqual(["aprendiz", "experto", null]);
    expect(matriz.avisos).toEqual(["Sin experto", null, "Nadie"]);
  });
  it("avisa de falta de experto también para autónomos", () => {
    expect(construirMatriz(empleados, servicios, [
      { empleado_id: 1, servicio_id: 1, nivel: "autonomo" },
    ]).avisos).toEqual(["Nadie", "Sin experto", "Nadie"]);
  });
  it("un experto de otra fila cubre el hueco de todo el servicio", () => {
    const activos = [empleados[0], { ...empleados[1], activo: true }];
    const matriz = construirMatriz(activos, servicios, [
      { empleado_id: 1, servicio_id: 1, nivel: "aprendiz" },
      { empleado_id: 2, servicio_id: 1, nivel: "experto" },
      { empleado_id: 99, servicio_id: 3, nivel: "experto" },
    ]);
    expect(matriz.filas[0].niveles).toEqual([null, "aprendiz", null]);
    expect(matriz.filas[1].niveles).toEqual([null, "experto", null]);
    expect(matriz.avisos).toEqual(["Nadie", null, "Nadie"]);
  });
  it("todos los servicios tienen hueco si no hay empleados", () => {
    expect(construirMatriz([], servicios, []).avisos).toEqual(["Nadie", "Nadie", "Nadie"]);
    expect(construirMatriz(empleados, [], []).filas[0].niveles).toEqual([]);
    expect(construirMatriz([], [], [])).toEqual({ grupos: [], servicios: [], filas: [], avisos: [] });
  });
});
