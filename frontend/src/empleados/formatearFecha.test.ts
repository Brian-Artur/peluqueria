import { describe, expect, it } from "vitest";
import { formatearFecha } from "./formatearFecha";

describe("fechas de contrato sin zona horaria", () => {
  it("muestra el día recibido, incluso en cambios de horario y año", () => {
    expect(formatearFecha("2026-03-29")).toBe("29/03/2026");
    expect(formatearFecha("2026-10-25")).toBe("25/10/2026");
    expect(formatearFecha("2027-01-01")).toBe("01/01/2027");
    expect(formatearFecha("2024-02-29")).toBe("29/02/2024");
  });
});
