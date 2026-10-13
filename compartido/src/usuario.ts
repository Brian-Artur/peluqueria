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

const esquemaNombreUsuario = z.string({ error: "El nombre de usuario debe ser un texto" }).trim()
  .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
  .max(50, "El nombre de usuario no puede superar los 50 caracteres")
  .regex(/^[a-z0-9._-]+$/, "El nombre de usuario solo admite minúsculas, dígitos, punto, guion y guion bajo");

const esquemaNombre = z.string({ error: "El nombre debe ser un texto" }).trim()
  .min(1, "El nombre es obligatorio")
  .max(120, "El nombre no puede superar los 120 caracteres");

const esquemaContrasena = z.string({ error: "La contraseña debe ser un texto" })
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(200, "La contraseña no puede superar los 200 caracteres");

export const esquemaUsuario = z.object({
  id: z.number().int().positive(),
  nombre_usuario: esquemaNombreUsuario,
  nombre: esquemaNombre,
  rol: esquemaRol,
  activo: z.boolean({ error: "Activo debe ser verdadero o falso" }),
  creado_en: z.iso.datetime({ error: "La fecha de creación debe estar en formato ISO" }),
});

export const esquemaCrearUsuario = z.object({
  nombre_usuario: esquemaNombreUsuario,
  nombre: esquemaNombre,
  rol: esquemaRol,
  contrasena: esquemaContrasena,
}, { error: "Los datos del usuario deben ser un objeto" });

export const esquemaEditarUsuario = z.object({
  nombre: esquemaNombre,
  rol: esquemaRol,
  activo: esquemaUsuario.shape.activo,
}, { error: "Los datos del usuario deben ser un objeto" });

export const esquemaContrasenaNueva = z.object({
  contrasena: esquemaContrasena,
}, { error: "Los datos de la contraseña deben ser un objeto" });

export const esquemaCambiarMiContrasena = z.object({
  actual: z.string({ error: "La contraseña actual debe ser un texto" })
    .min(1, "La contraseña actual es obligatoria")
    .max(200, "La contraseña actual no puede superar los 200 caracteres"),
  nueva: esquemaContrasena,
}, { error: "Los datos de la contraseña deben ser un objeto" });

export type Rol = z.infer<typeof esquemaRol>;
export type UsuarioSesion = z.infer<typeof esquemaUsuarioSesion>;
export type Credenciales = z.infer<typeof esquemaCredenciales>;
export type Usuario = z.infer<typeof esquemaUsuario>;
export type CrearUsuario = z.infer<typeof esquemaCrearUsuario>;
export type EditarUsuario = z.infer<typeof esquemaEditarUsuario>;
export type ContrasenaNueva = z.infer<typeof esquemaContrasenaNueva>;
export type CambiarMiContrasena = z.infer<typeof esquemaCambiarMiContrasena>;
