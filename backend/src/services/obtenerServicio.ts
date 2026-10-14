import type { Servicio } from "@peluqueria/compartido";
import { findServicioById } from "../repositories/servicioRepository";
import { ErrorNoEncontrado } from "../errores";

export async function obtenerServicio(id: number): Promise<Servicio> {
  const servicio = await findServicioById(id);
  if (!servicio) throw new ErrorNoEncontrado("Servicio no encontrado");
  return servicio;
}
