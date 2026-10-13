import { z } from "zod";
import type { Rol } from "./usuario";

export const esquemaPermiso = z.enum([
  "citas:ver",
  "citas:gestionar",
  "citas:completar",
  "clientes:ver",
  "clientes:gestionar",
  "usuarios:gestionar",
]);

export type Permiso = z.infer<typeof esquemaPermiso>;

// Única fuente de quién puede qué: el backend la hace cumplir y el frontend
// la usa solo para ocultar botones; ocultarlos no protege la API.
export const rolesPorPermiso: Record<Permiso, Rol[]> = {
  "citas:ver": ["admin", "encargado", "recepcion", "empleado"],
  "citas:gestionar": ["admin", "encargado", "recepcion"],
  "citas:completar": ["admin", "encargado", "recepcion", "empleado"],
  "clientes:ver": ["admin", "encargado", "recepcion", "empleado"],
  "clientes:gestionar": ["admin", "encargado", "recepcion"],
  "usuarios:gestionar": ["admin"],
};

export function puede(rol: Rol, permiso: Permiso): boolean {
  return rolesPorPermiso[permiso].includes(rol);
}
