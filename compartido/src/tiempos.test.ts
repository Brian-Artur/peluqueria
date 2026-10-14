import { describe, expect, it } from "vitest";
import { esquemaCambioTiempo, esquemaDatosTiempo, esquemaTiempoEmpleado } from "./tiempos";

describe("contratos de tiempos", () => {
  it.each([null, 5, 30, 600])("acepta duración propia %j", (duracion_min) => {
    expect(esquemaDatosTiempo.parse({ duracion_min, margen_min: 0 })).toEqual({ duracion_min, margen_min: 0 });
  });

  it.each([0, 1, 7, 605, 30.5, "30", undefined])("rechaza duración propia %j", (duracion_min) => {
    expect(esquemaDatosTiempo.safeParse({ duracion_min, margen_min: 0 }).success).toBe(false);
  });

  it.each([0, 5, 60])("acepta margen propio %i", (margen_min) => {
    expect(esquemaDatosTiempo.safeParse({ duracion_min: null, margen_min }).success).toBe(true);
  });

  it.each([-5, 1, 65, 5.5, null, "5", undefined])("rechaza margen propio %j", (margen_min) => {
    expect(esquemaDatosTiempo.safeParse({ duracion_min: null, margen_min }).success).toBe(false);
  });

  const cambio = { usuario_nombre: "Encargado", cambiado_en: "2026-10-14T12:00:00.000Z" };
  const tiempo = {
    servicio_id: 1, servicio_nombre: "Corte", categoria_nombre: null, dificultad: "alta", nivel: "aprendiz",
    duracion_servicio: 30, margen_servicio: 5, duracion_propia: null, margen_propio: 10,
    duracion_agendada: 45, ultimo_cambio: null,
  };

  it("acepta categoría y último cambio nulos o con datos y hasta 720 minutos agendados", () => {
    expect(esquemaTiempoEmpleado.parse(tiempo)).toEqual(tiempo);
    expect(esquemaTiempoEmpleado.parse({ ...tiempo, ultimo_cambio: cambio }).ultimo_cambio).toEqual(cambio);
    expect(esquemaTiempoEmpleado.safeParse({ ...tiempo, duracion_agendada: 720 }).success).toBe(true);
    expect(esquemaTiempoEmpleado.safeParse({ ...tiempo, duracion_agendada: 31 }).success).toBe(false);
  });

  it("valida historial, valores nulos y fecha ISO", () => {
    const historial = { ...cambio, servicio_nombre: "Corte", campo: "duracion", valor_anterior: null, valor_nuevo: 45 };
    expect(esquemaCambioTiempo.parse(historial)).toEqual(historial);
    expect(esquemaCambioTiempo.safeParse({ ...historial, valor_nuevo: null }).success).toBe(true);
    expect(esquemaCambioTiempo.safeParse({ ...historial, campo: "precio" }).success).toBe(false);
    expect(esquemaCambioTiempo.safeParse({ ...historial, cambiado_en: "2026-10-14 12:00:00" }).success).toBe(false);
    expect(esquemaTiempoEmpleado.safeParse({ ...tiempo, ultimo_cambio: { ...cambio, cambiado_en: "ayer" } }).success).toBe(false);
  });
});
