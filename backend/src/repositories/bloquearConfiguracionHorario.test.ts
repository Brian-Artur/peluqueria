import { describe, expect, it, vi } from "vitest";
import type { Connection } from "mysql2/promise";
import { bloquearConfiguracionHorario } from "./bloquearConfiguracionHorario";

describe("bloquear la configuración del horario sin BD", () => {
  it("bloquea siempre la fila única, incluso si aún no hay temporadas", async () => {
    const consultar = vi.fn().mockResolvedValue([[{ id: 1 }]]);
    await expect(bloquearConfiguracionHorario({ query: consultar } as unknown as Connection)).resolves.toBe(true);
    expect(consultar).toHaveBeenCalledExactlyOnceWith("SELECT id FROM local WHERE id = ? FOR UPDATE", [1]);
  });
  it("informa si falta el local", async () => {
    const consultar = vi.fn().mockResolvedValue([[]]);
    await expect(bloquearConfiguracionHorario({ query: consultar } as unknown as Connection)).resolves.toBe(false);
  });
});
