import { esquemaRespuestaError } from "@peluqueria/compartido";
import type { z } from "zod";

export async function pedir(url: string, opciones?: RequestInit): Promise<Response> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, opciones);
  } catch {
    throw new Error("No se pudo conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.");
  }

  if (respuesta.ok) return respuesta;

  let mensaje = `Error HTTP ${respuesta.status}`;
  try {
    const cuerpo: unknown = await respuesta.json();
    const resultado = esquemaRespuestaError.safeParse(cuerpo);
    if (resultado.success) {
      mensaje = resultado.data.error;
    }
  } catch {
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

// Un catch recibe unknown: lo que se lanzó puede no ser un Error.
export function mensajeDeError(fallo: unknown, porDefecto = "Error inesperado"): string {
  if (fallo instanceof Error) return fallo.message;
  return porDefecto;
}
