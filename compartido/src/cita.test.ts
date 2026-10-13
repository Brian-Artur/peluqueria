import { describe, expect, it } from "vitest";
import { esquemaCita, esquemaCrearCita, esquemaMoverCita } from "./cita";

describe("el contrato de cita", () => {
  const cita = {
    id: 1,
    inicio: "2026-07-06T08:05:00.000Z",
    fin: "2026-07-06T08:35:00.000Z",
    estado: "reservada",
    cliente_id: 2,
    cliente_nombre: "Ana",
    servicio_id: 3,
    servicio_nombre: "Corte",
  };

  it("acepta las fechas serializadas de la API", () => {
    expect(esquemaCita.parse(cita)).toEqual(cita);
  });

  it.each([
    { motivo: "una fecha sin serializar", cambio: { inicio: new Date(cita.inicio) } },
    { motivo: "una fecha inválida", cambio: { fin: "mañana" } },
    { motivo: "un estado desconocido", cambio: { estado: "pendiente" } },
  ])("rechaza $motivo", ({ cambio }) => {
    expect(esquemaCita.safeParse({ ...cita, ...cambio }).success).toBe(false);
  });

  it("aplica la misma franja de cinco minutos a la creación y al movimiento", () => {
    const inicio = "2026-07-06T08:07:00.000Z";

    expect(esquemaCrearCita.safeParse({ cliente_id: 2, servicio_id: 3, inicio }).success).toBe(false);
    expect(esquemaMoverCita.safeParse({ inicio }).success).toBe(false);
  });
});
