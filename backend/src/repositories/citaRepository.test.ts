import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaCita } from "@peluqueria/compartido";
import { findAllCitas, findCitaById } from "./citaRepository";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));

// Las traducciones se prueban sin conectar a la BD ni cargar sus credenciales.
vi.mock("../db", () => ({ pool: { query: consultar } }));

afterEach(() => {
  vi.resetAllMocks();
});

describe("la traducción de filas de cita", () => {
  const fila = {
    id: 1,
    inicio: new Date("2026-07-06T08:05:00.000Z"),
    fin: new Date("2026-07-06T08:35:00.000Z"),
    estado: "reservada",
    cliente_id: 2,
    servicio_id: 3,
  };

  it("devuelve el contrato con fechas ISO y conserva el JSON que serializaba mysql2", async () => {
    const filaConNombres = { ...fila, cliente_nombre: "Ana", servicio_nombre: "Corte" };
    consultar.mockResolvedValue([[filaConNombres], []]);

    const citas = await findAllCitas();

    expect(citas).toEqual(JSON.parse(JSON.stringify([filaConNombres])));
    expect(esquemaCita.safeParse(citas[0]).success).toBe(true);
  });

  it("traduce las fechas también en la consulta por id sin añadir nombres", async () => {
    consultar.mockResolvedValue([[fila], []]);

    await expect(findCitaById(1)).resolves.toEqual(JSON.parse(JSON.stringify(fila)));
  });

  it("devuelve null si no hay una cita con ese id", async () => {
    consultar.mockResolvedValue([[], []]);

    await expect(findCitaById(99)).resolves.toBeNull();
  });
});
