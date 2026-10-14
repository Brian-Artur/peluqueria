import { describe, expect, it } from "vitest";
import type { CambioTiempo } from "@peluqueria/compartido";
import { textoCambioTiempo, textoUltimoCambio } from "./textoCambioTiempo";

describe("texto del historial de tiempos", () => {
  const cambio: CambioTiempo = {
    servicio_nombre: "Corte de pelo", campo: "duracion", valor_anterior: null, valor_nuevo: 40,
    usuario_nombre: "Encargado demo", cambiado_en: "2026-10-14T08:32:00Z",
  };
  it("explica la duración heredada y convierte la fecha UTC a hora local", () => {
    expect(textoCambioTiempo(cambio)).toBe("Corte de pelo · duración: la del servicio → 40 min · Encargado demo · 14/10/2026 10:32");
  });
  it("explica también la vuelta a la duración del servicio", () => {
    expect(textoCambioTiempo({ ...cambio, valor_anterior: 40, valor_nuevo: null }))
      .toContain("duración: 40 min → la del servicio");
  });
  it("muestra un cambio de margen, incluido el cero", () => {
    expect(textoCambioTiempo({ ...cambio, campo: "margen", valor_anterior: 0, valor_nuevo: 10 }))
      .toContain("margen: 0 min → 10 min");
  });
  it("muestra el último cambio sin hora y respeta el cambio de día local", () => {
    expect(textoUltimoCambio(cambio)).toBe("Encargado demo, 14/10/2026");
    expect(textoCambioTiempo({ ...cambio, cambiado_en: "2026-12-31T23:32:00Z" }))
      .toContain("01/01/2027 00:32");
  });
});
