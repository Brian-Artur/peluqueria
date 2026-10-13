import type { Rol } from "@peluqueria/compartido";

const nombresRol: Record<Rol, string> = {
  admin: "Admin",
  encargado: "Encargado",
  recepcion: "Recepción",
  empleado: "Empleado",
};

export function textoRol(rol: Rol): string {
  return nombresRol[rol];
}
