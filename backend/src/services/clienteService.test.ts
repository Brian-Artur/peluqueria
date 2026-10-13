import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorNoEncontrado } from "../errores";
import { editarCliente, obtenerCliente } from "./clienteService";

const { buscarCliente, actualizar } = vi.hoisted(() => ({
  buscarCliente: vi.fn(),
  actualizar: vi.fn(),
}));

vi.mock("../repositories/clienteRepository", () => ({
  findAllClientes: vi.fn(),
  findClienteById: buscarCliente,
  insertarCliente: vi.fn(),
  actualizarCliente: actualizar,
}));

afterEach(() => {
  vi.resetAllMocks();
});

describe("la existencia de clientes", () => {
  const datos = { nombre: "Ana", telefono: null, email: null, notas: null };
  const cliente = { id: 1, ...datos };

  it("devuelve el cliente encontrado", async () => {
    buscarCliente.mockResolvedValue(cliente);
    await expect(obtenerCliente(1)).resolves.toEqual(cliente);
  });

  it("lanza el error de 404 al consultar un cliente inexistente", async () => {
    buscarCliente.mockResolvedValue(null);
    await expect(obtenerCliente(99)).rejects.toThrow(ErrorNoEncontrado);
  });

  it("impide editar un cliente inexistente", async () => {
    buscarCliente.mockResolvedValue(null);
    await expect(editarCliente(99, datos)).rejects.toThrow(ErrorNoEncontrado);
    expect(actualizar).not.toHaveBeenCalled();
  });

  it("permite editar y reenviar los mismos datos a un cliente existente", async () => {
    buscarCliente.mockResolvedValue(cliente);
    actualizar.mockResolvedValue(undefined);
    await expect(editarCliente(1, datos)).resolves.toBeUndefined();
    expect(actualizar).toHaveBeenCalledWith(1, datos);
  });
});
