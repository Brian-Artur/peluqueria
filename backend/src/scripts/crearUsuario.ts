import { createInterface } from "node:readline/promises";
import { z } from "zod";
import { esquemaCredenciales, esquemaRol } from "@peluqueria/compartido";
import { crearConexionScripts } from "./conexionScripts";
import { insertarUsuario } from "../repositories/usuarioRepository";
import { cifrarContrasena } from "../seguridad/contrasena";
import { leerContrasena } from "../seguridad/leerContrasena";

const esquemaDatosUsuario = z.object({
  nombre_usuario: esquemaCredenciales.shape.nombre_usuario,
  nombre: z.string().trim().min(1, "El nombre es obligatorio")
    .max(120, "El nombre no puede superar los 120 caracteres"),
  rol: esquemaRol,
});

async function crearUsuario(): Promise<void> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error("Ejecuta crear-usuario en una terminal interactiva");
  }

  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  let datos: z.infer<typeof esquemaDatosUsuario>;
  try {
    const nombre_usuario = await terminal.question("Nombre de usuario: ");
    const nombre = await terminal.question("Nombre: ");
    const rol = await terminal.question("Rol (admin, encargado, recepcion, empleado): ");
    const resultado = esquemaDatosUsuario.safeParse({ nombre_usuario, nombre, rol: rol.trim() });
    if (!resultado.success) {
      throw new Error(resultado.error.issues.map((problema) => problema.message).join("; "));
    }
    datos = resultado.data;
  } finally {
    // Readline haría eco de las teclas; se cierra antes de pedir la contraseña.
    terminal.close();
  }

  const contrasena = await leerContrasena("Contraseña (mínimo 8 caracteres): ");
  const confirmacion = await leerContrasena("Confirma la contraseña: ");
  if (contrasena.length < 8) throw new Error("La contraseña debe tener al menos 8 caracteres");
  if (contrasena !== confirmacion) throw new Error("Las contraseñas no coinciden");

  const hash_contrasena = await cifrarContrasena(contrasena);
  const conexion = await crearConexionScripts();
  try {
    const id = await insertarUsuario({ ...datos, hash_contrasena }, conexion);
    console.log(`Usuario ${datos.nombre_usuario} creado (id ${id})`);
  } finally {
    await conexion.end();
  }
}

void crearUsuario().catch((error: unknown): void => {
  const mensaje = error instanceof Error ? error.message : "Error desconocido";
  console.error(`No se pudo crear el usuario: ${mensaje}`);
  process.exitCode = 1;
});
