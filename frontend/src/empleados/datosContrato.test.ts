import { describe, expect, it } from "vitest";
import { datosContrato } from "./datosContrato";

describe("datos del formulario de contrato", () => {
  it("no envía tutor ni empresa de otros tipos de contrato", () => {
    expect(datosContrato({ tipo: "plantilla", desde: "2026-10-14", tutor_id: "4", empresa: "Empresa" }))
      .toEqual({ tipo: "plantilla", desde: "2026-10-14", tutor_id: null, empresa: null });
  });
  it("convierte el tutor elegido y admite prácticas sin tutor", () => {
    expect(datosContrato({ tipo: "practicas", desde: "2026-10-14", tutor_id: "4", empresa: "" }).tutor_id).toBe(4);
    expect(datosContrato({ tipo: "practicas", desde: "2026-10-14", tutor_id: "", empresa: "" }).tutor_id).toBeNull();
  });
  it("envía la empresa solo para externos", () => {
    expect(datosContrato({ tipo: "externo", desde: "2026-10-14", tutor_id: "4", empresa: "Empresa" }))
      .toEqual({ tipo: "externo", desde: "2026-10-14", tutor_id: null, empresa: "Empresa" });
  });
});
