import { describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { insertarExcepcion } from "./insertarExcepcion";
import { ErrorConflicto } from "../errores";

const datos = { fecha: "2026-07-12", cerrado: false, motivo: "Bodas", tramos: [{ abre: "09:00", cierra: "14:00" }] };

describe("insertar excepción sin BD", () => {
  it("asocia los tramos al id generado y parametriza fecha y motivo", async () => {
    const consultar = vi.fn().mockResolvedValueOnce([{ insertId: 7 }]).mockResolvedValue([]);
    await expect(insertarExcepcion(datos, { query: consultar } as unknown as Connection)).resolves.toBe(7);
    expect(consultar).toHaveBeenNthCalledWith(1, expect.stringContaining("VALUES (?, ?, ?)"), ["2026-07-12", false, "Bodas"]);
    expect(consultar).toHaveBeenNthCalledWith(2, expect.stringContaining("INSERT INTO excepcion_tramo"), [7, "09:00", "14:00"]);
  });
  it("una excepción cerrada no inserta tramos", async () => {
    const consultar = vi.fn().mockResolvedValue([{ insertId: 7 }]);
    await insertarExcepcion({ ...datos, cerrado: true, tramos: [] }, { query: consultar } as unknown as Connection);
    expect(consultar).toHaveBeenCalledTimes(1);
  });
  it("la restricción UNIQUE da 409 sin insertar tramos", async () => {
    const consultar = vi.fn().mockRejectedValue({ code: "ER_DUP_ENTRY" });
    await expect(insertarExcepcion(datos, { query: consultar } as unknown as Connection)).rejects.toThrow(ErrorConflicto);
    expect(consultar).toHaveBeenCalledTimes(1);
  });
  it("propaga el fallo de un tramo para que el servicio revierta la transacción", async () => {
    const error = new Error("Fallo de tramo");
    const consultar = vi.fn().mockResolvedValueOnce([{ insertId: 7 }]).mockRejectedValueOnce(error);
    await expect(insertarExcepcion(datos, { query: consultar } as unknown as Connection)).rejects.toBe(error);
  });
});
