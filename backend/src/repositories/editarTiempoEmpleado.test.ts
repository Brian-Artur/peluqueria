import type { Connection } from "mysql2/promise";
import { afterEach, describe, expect, it, vi } from "vitest";
import { actualizarTiempoEmpleado, bloquearTiempoEmpleado, insertarCambioTiempo } from "./editarTiempoEmpleado";

const consultar = vi.fn();
const conexion = { query: consultar } as unknown as Connection;
afterEach(() => vi.resetAllMocks());

describe("escritura de tiempos sin BD", () => {
  it("bloquea solo la competencia solicitada y traduce los datos", async () => {
    consultar.mockResolvedValue([[{ duracion_min: null, margen_min: 5, interno: "privado" }], []]);
    await expect(bloquearTiempoEmpleado(1, 2, conexion)).resolves.toEqual({ duracion_min: null, margen_min: 5 });
    expect(consultar).toHaveBeenCalledWith(
      "SELECT duracion_min, margen_min FROM competencia WHERE empleado_id = ? AND servicio_id = ? FOR UPDATE", [1, 2]
    );
  });
  it("devuelve null si no existe la competencia", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(bloquearTiempoEmpleado(1, 2, conexion)).resolves.toBeNull();
  });
  it("actualiza los tiempos y registra el usuario con SQL parametrizado en la misma conexión", async () => {
    consultar.mockResolvedValue([{}, []]);
    await actualizarTiempoEmpleado(1, 2, { duracion_min: null, margen_min: 10 }, conexion);
    await insertarCambioTiempo(1, 2, 7, "duracion", 45, null, conexion);
    expect(consultar).toHaveBeenNthCalledWith(1,
      "UPDATE competencia SET duracion_min = ?, margen_min = ? WHERE empleado_id = ? AND servicio_id = ?", [null, 10, 1, 2]
    );
    expect(consultar).toHaveBeenNthCalledWith(2, expect.stringContaining("VALUES (?, ?, ?, ?, ?, ?)"), [1, 2, "duracion", 45, null, 7]);
  });
});
