import type { Cliente, DatosCliente } from "@peluqueria/compartido";
import { ErrorNoEncontrado } from "../errores";
import {
  findAllClientes,
  findClienteById,
  insertarCliente,
  actualizarCliente,
} from "../repositories/clienteRepository";

export async function listarClientes(buscar: string): Promise<Cliente[]> {
  return findAllClientes(buscar);
}

export async function obtenerCliente(id: number): Promise<Cliente> {
  const cliente = await findClienteById(id);
  if (!cliente) throw new ErrorNoEncontrado("Cliente no encontrado");
  return cliente;
}

export async function crearCliente(datos: DatosCliente): Promise<number> {
  return insertarCliente(datos);
}

export async function editarCliente(id: number, datos: DatosCliente): Promise<void> {
  await obtenerCliente(id);
  await actualizarCliente(id, datos);
}
