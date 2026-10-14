import type { Servicio } from "@peluqueria/compartido";
import { findAllServicios } from "../repositories/servicioRepository";

export async function listarServicios(incluirInactivos: boolean): Promise<Servicio[]> {
  return findAllServicios(incluirInactivos);
}
