import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaServicio } from "@peluqueria/compartido";
import { actualizarServicio, findAllServicios, findServicioById } from "./servicioRepository";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));
vi.mock("../db", () => ({ pool: { query: consultar } }));
afterEach(() => vi.resetAllMocks());

describe("repositorio de servicios sin BD", () => {
  const fila = { id: 1, nombre: "Corte", categoria_id: 2, categoria_nombre: "Pelo", activo: 1, duracion_min: 30, precio: "15.00" };

  it("traduce la categoría y el estado al contrato y pide solo activos por defecto", async () => {
    consultar.mockResolvedValue([[{ ...fila, interno: "privado" }], []]);
    const lista = await findAllServicios();
    expect(lista).toEqual([{ ...fila, activo: true }]);
    expect(esquemaServicio.safeParse(lista[0]).success).toBe(true);
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("s.activo = TRUE"), [false]);
  });

  it("incluye inactivos cuando se solicita y conserva Sin categoría", async () => {
    consultar.mockResolvedValue([[{ ...fila, activo: 0, categoria_id: null, categoria_nombre: null }], []]);
    const lista = await findAllServicios(true);
    expect(lista[0]).toMatchObject({ activo: false, categoria_id: null, categoria_nombre: null });
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("LEFT JOIN"), [true]);
  });

  it("busca por id incluso servicios inactivos", async () => {
    consultar.mockResolvedValue([[{ ...fila, activo: 0 }], []]);
    await expect(findServicioById(1)).resolves.toEqual({ ...fila, activo: false });
    expect(consultar).toHaveBeenCalledWith(expect.stringContaining("WHERE s.id = ?"), [1]);
  });

  it("devuelve null si el servicio no existe", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(findServicioById(99)).resolves.toBeNull();
  });

  it("editar duración y precio actualiza solo servicio y nunca las citas", async () => {
    consultar.mockResolvedValue([{}, []]);
    const datos = { nombre: "Corte", categoria_id: null, activo: false, duracion_min: 45, precio: "20.00" };
    await actualizarServicio(1, datos);
    expect(consultar).toHaveBeenCalledTimes(1);
    expect(consultar).toHaveBeenCalledWith(
      "UPDATE servicio SET nombre = ?, categoria_id = ?, duracion_min = ?, precio = ?, activo = ? WHERE id = ?",
      ["Corte", null, 45, "20.00", false, 1]
    );
  });
});
