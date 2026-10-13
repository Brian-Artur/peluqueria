import { esquemaRespuestaError } from "@peluqueria/compartido";
import type { z } from "zod";

let avisarSesionPerdida: (() => void) | null = null;

export function alPerderSesion(callback: () => void): () => void {
  avisarSesionPerdida = callback;
  return (): void => {
    if (avisarSesionPerdida === callback) avisarSesionPerdida = null;
  };
}

export async function pedir(url: string, opciones?: RequestInit): Promise<Response> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, opciones);
  } catch (fallo) {
    if (esAbortada(fallo)) throw fallo;
    throw new Error("No se pudo conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.", { cause: fallo });
  }

  if (respuesta.ok) return respuesta;

  // Una petición abandonada no debe cerrar una sesión que se abrió después.
  opciones?.signal?.throwIfAborted();
  const esEntrada = url === "/api/sesion" && opciones?.method?.toUpperCase() === "POST";
  if (respuesta.status === 401 && !esEntrada) avisarSesionPerdida?.();

  let mensaje = `Error HTTP ${respuesta.status}`;
  try {
    const cuerpo: unknown = await respuesta.json();
    const resultado = esquemaRespuestaError.safeParse(cuerpo);
    if (resultado.success) {
      mensaje = resultado.data.error;
    }
  } catch (fallo) {
    if (esAbortada(fallo)) throw fallo;
    // Un proxy puede devolver HTML; el estado HTTP sigue siendo útil para informar.
  }

  throw new Error(mensaje);
}

export async function pedirJson<T>(
  url: string,
  esquema: z.ZodType<T>,
  opciones?: RequestInit,
): Promise<T> {
  const respuesta = await pedir(url, opciones);
  const cuerpo: unknown = await respuesta.json();
  const resultado = esquema.safeParse(cuerpo);
  if (!resultado.success) {
    console.error(`Respuesta inválida (${url})`, resultado.error);
    throw new Error(`El servidor devolvió datos con una forma inesperada (${url})`);
  }
  return resultado.data;
}

export function esAbortada(fallo: unknown): boolean {
  return fallo instanceof DOMException && fallo.name === "AbortError";
}

// Un catch recibe unknown: lo que se lanzó puede no ser un Error.
export function mensajeDeError(fallo: unknown, porDefecto = "Error inesperado"): string {
  if (fallo instanceof Error) return fallo.message;
  return porDefecto;
}
