import { z } from "zod";

export const esquemaRol = z.enum(["admin", "encargado", "recepcion", "empleado"], {
  error: "El rol debe ser admin, encargado, recepcion o empleado",
});

export const esquemaUsuarioSesion = z.object({
  id: z.number().int().positive(),
  nombre: z.string(),
  nombre_usuario: z.string(),
  rol: esquemaRol,
});

export const esquemaCredenciales = z.object({
  nombre_usuario: z.string({ error: "El usuario debe ser un texto" }).trim()
    .min(1, "El usuario es obligatorio").max(50, "El usuario no puede superar los 50 caracteres"),
  contrasena: z.string({ error: "La contraseña debe ser un texto" }).min(1, "La contraseña es obligatoria"),
});

export type Rol = z.infer<typeof esquemaRol>;
export type UsuarioSesion = z.infer<typeof esquemaUsuarioSesion>;
export type Credenciales = z.infer<typeof esquemaCredenciales>;
