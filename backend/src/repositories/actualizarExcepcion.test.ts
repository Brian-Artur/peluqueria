import { describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { actualizarExcepcion, bloquearExcepcion } from "./actualizarExcepcion";
import { ErrorConflicto } from "../errores";

const datos = { fecha: "2026-07-12", cerrado: false, motivo: "Bodas", tramos: [{ abre: "09:00", cierra: "14:00" }, { abre: "16:00", cierra: "20:00" }] };

describe("actualizar excepción sin BD", () => {
  it("bloquea la excepción antes de reemplazarla e informa si falta", async () => {
    const consultar = vi.fn().mockResolvedValueOnce([[{ id: 7 }]]).mockResolvedValueOnce([[]]);
    const conexion = { query: consultar } as unknown as Connection;
    await expect(bloquearExcepcion(7, conexion)).resolves.toBe(true);
    await expect(bloquearExcepcion(99, conexion)).resolves.toBe(false);
    expect(consultar).toHaveBeenNthCalledWith(1, "SELECT id FROM excepcion_horario WHERE id = ? FOR UPDATE", [7]);
  });
  it("reemplaza todos los tramos de la excepción y conserva los de otras fechas", async () => {
    const consultar = vi.fn().mockResolvedValue([]);
    await actualizarExcepcion(7, datos, { query: consultar } as unknown as Connection);
    expect(consultar).toHaveBeenNthCalledWith(1, expect.stringContaining("WHERE id = ?"), ["2026-07-12", false, "Bodas", 7]);
    expect(consultar).toHaveBeenNthCalledWith(2, "DELETE FROM excepcion_tramo WHERE excepcion_id = ?", [7]);
    expect(consultar).toHaveBeenNthCalledWith(3, expect.stringContaining("INSERT INTO excepcion_tramo"), [7, "09:00", "14:00"]);
    expect(consultar).toHaveBeenNthCalledWith(4, expect.stringContaining("INSERT INTO excepcion_tramo"), [7, "16:00", "20:00"]);
  });
  it("al cerrar elimina los tramos anteriores sin insertar nuevos", async () => {
    const consultar = vi.fn().mockResolvedValue([]);
    await actualizarExcepcion(7, { ...datos, cerrado: true, tramos: [] }, { query: consultar } as unknown as Connection);
    expect(consultar).toHaveBeenCalledTimes(2);
    expect(consultar).toHaveBeenLastCalledWith("DELETE FROM excepcion_tramo WHERE excepcion_id = ?", [7]);
  });
  it("fecha duplicada da 409 antes de borrar tramos", async () => {
    const consultar = vi.fn().mockRejectedValue({ code: "ER_DUP_ENTRY" });
    await expect(actualizarExcepcion(7, datos, { query: consultar } as unknown as Connection)).rejects.toThrow(ErrorConflicto);
    expect(consultar).toHaveBeenCalledTimes(1);
  });
});
