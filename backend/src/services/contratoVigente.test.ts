import type { Contrato } from "@peluqueria/compartido";
import { describe, expect, it } from "vitest";
import { ErrorConflicto } from "../errores";
import { contratoVigente } from "./contratoVigente";

const contrato: Contrato = { id: 1, tipo: "plantilla", desde: "2026-01-01", hasta: null, tutor_id: null, tutor_nombre: null, empresa: null };

describe("encontrar el único contrato vigente", () => {
  it("devuelve null sin vigente, o el único contrato sin hasta", () => {
    expect(contratoVigente([])).toBeNull();
    expect(contratoVigente([{ ...contrato, hasta: "2026-02-01" }])).toBeNull();
    expect(contratoVigente([{ ...contrato, id: 2, hasta: "2025-12-31" }, contrato])).toEqual(contrato);
  });

  it("rechaza más de un vigente con 409", () => {
    expect(() => contratoVigente([contrato, { ...contrato, id: 2 }])).toThrow(ErrorConflicto);
  });
});
