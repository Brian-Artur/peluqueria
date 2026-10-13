import { afterEach, describe, expect, it, vi } from "vitest";
import { esquemaCliente } from "@peluqueria/compartido";
import { findAllClientes, findClienteById } from "./clienteRepository";

const { consultar } = vi.hoisted(() => ({ consultar: vi.fn() }));

// Se comprueba el contrato sin conectar a la BD ni cargar sus credenciales.
vi.mock("../db", () => ({ pool: { query: consultar } }));

afterEach(() => {
  vi.resetAllMocks();
});

describe("la traducción de filas de cliente", () => {
  const cliente = { id: 1, nombre: "Ana", telefono: null, email: "ana@example.com", notas: null };

  it("devuelve únicamente los campos del contrato", async () => {
    consultar.mockResolvedValue([[{ ...cliente, campoInterno: "privado" }], []]);
    const clientes = await findAllClientes();
    expect(clientes).toEqual([cliente]);
    expect(esquemaCliente.safeParse(clientes[0]).success).toBe(true);
  });

  it("incluye los campos nuevos al buscar por id", async () => {
    consultar.mockResolvedValue([[cliente], []]);
    await expect(findClienteById(1)).resolves.toEqual(cliente);
  });

  it("devuelve null si no existe el cliente", async () => {
    consultar.mockResolvedValue([[], []]);
    await expect(findClienteById(99)).resolves.toBeNull();
  });

  it("parametriza los tres filtros con el patrón literal escapado", async () => {
    consultar.mockResolvedValue([[], []]);
    await findAllClientes("Ana!%_");
    expect(consultar).toHaveBeenCalledWith(
      expect.stringContaining("ESCAPE '!'"),
      ["%Ana!!!%!_%", "%Ana!!!%!_%", "%Ana!!!%!_%"]
    );
  });
});
