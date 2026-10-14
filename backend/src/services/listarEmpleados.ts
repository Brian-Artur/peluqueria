import type { EmpleadoResumen } from "@peluqueria/compartido";
import { consultarEmpleados } from "../repositories/empleadoRepository";

export async function listarEmpleados(incluirInactivos: boolean = false): Promise<EmpleadoResumen[]> {
  return consultarEmpleados(incluirInactivos);
}
