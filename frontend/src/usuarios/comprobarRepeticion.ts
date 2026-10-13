export function comprobarRepeticion(contrasena: string, repetida: string): string | null {
  if (contrasena !== repetida) return "Las contraseñas no coinciden";
  return null;
}
