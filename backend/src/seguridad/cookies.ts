import { DURACION_SESION_SEGUNDOS } from "./sesion";

export function leerCookie(cabecera: string | undefined, nombre: string): string | null {
  if (!cabecera) return null;

  for (const parte of cabecera.split(";")) {
    const separador = parte.indexOf("=");
    if (separador < 0 || parte.slice(0, separador).trim() !== nombre) continue;
    try {
      return decodeURIComponent(parte.slice(separador + 1).trim());
    } catch {
      return null;
    }
  }
  return null;
}

function construirCookie(token: string, duracion: number): string {
  let cabecera = `sesion=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${duracion}`;
  if (process.env.COOKIE_SEGURA === "true") cabecera += "; Secure";
  return cabecera;
}

export function crearCookieSesion(token: string): string {
  return construirCookie(token, DURACION_SESION_SEGUNDOS);
}

export function caducarCookieSesion(): string {
  return construirCookie("", 0);
}
