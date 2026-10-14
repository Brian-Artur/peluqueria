import { describe, expect, it } from "vitest";
import { calcularDuracionAgendada } from "./calcularDuracionAgendada";

describe("calcular duración agendada", () => {
  it("usa la duración del servicio sin duración propia", () => {
    expect(calcularDuracionAgendada(30, null, 0, 0)).toBe(30);
  });
  it("prefiere la duración propia", () => {
    expect(calcularDuracionAgendada(30, 45, 0, 0)).toBe(45);
  });
  it("suma ambos márgenes con duración propia y sin ella", () => {
    expect(calcularDuracionAgendada(30, 45, 5, 10)).toBe(60);
    expect(calcularDuracionAgendada(30, null, 5, 10)).toBe(45);
  });
  it("respeta todos los ceros, incluso una duración propia cero", () => {
    expect(calcularDuracionAgendada(0, null, 0, 0)).toBe(0);
    expect(calcularDuracionAgendada(30, 0, 0, 0)).toBe(0);
  });
});
