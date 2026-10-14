import { afterEach, describe, expect, it, vi } from "vitest";
import { consultarTiemposEmpleado } from "./consultarTiemposEmpleado";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());

describe("consulta de tiempos sin BD", () => {
  const fila = {
    servicio_id: 2, servicio_nombre: "Corte", categoria_nombre: null, dificultad: "media", nivel: "experto",
    duracion_servicio: 30, margen_servicio: 5, duracion_propia: 25, margen_propio: 0,
    usuario_nombre: "Encargado", cambiado_en: new Date("2026-10-14T12:00:00Z"), interno: "privado",
  };

  it("traduce el último cambio a ISO y descarta los campos internos", async () => {
    consultar.mockResolvedValue([[fila], []]);
    await expect(consultarTiemposEmpleado(1)).resolves.toEqual([{
      servicio_id: 2, servicio_nombre: "Corte", categoria_nombre: null, dificultad: "media", nivel: "experto",
      duracion_servicio: 30, margen_servicio: 5, duracion_propia: 25, margen_propio: 0,
      ultimo_cambio: { usuario_nombre: "Encargado", cambiado_en: "2026-10-14T12:00:00.000Z" },
    }]);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("WHERE c.empleado_id = ? AND s.activo = TRUE"), [1]);
    const sql = consultar.mock.calls[0][0];
    expect(sql).toContain("LEFT JOIN categoria_servicio");
    expect(sql).toContain("ultimo.servicio_id = c.servicio_id");
    expect(sql).toContain("ultimo.empleado_id = c.empleado_id");
    expect(sql).toContain("ORDER BY ultimo.cambiado_en DESC, ultimo.id DESC LIMIT 1");
  });

  it("devuelve null sin cambios previos y conserva duración heredada", async () => {
    consultar.mockResolvedValue([[{ ...fila, duracion_propia: null, usuario_nombre: null, cambiado_en: null }], []]);
    const tiempos = await consultarTiemposEmpleado(1);
    expect(tiempos[0]).toMatchObject({ duracion_propia: null, ultimo_cambio: null });
    expect(tiempos[0]).not.toHaveProperty("duracion_agendada");
  });
});
