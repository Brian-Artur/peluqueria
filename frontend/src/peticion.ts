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
    if (
      typeof cuerpo === "object" && cuerpo !== null &&
      "error" in cuerpo && typeof cuerpo.error === "string"
    ) {
      mensaje = cuerpo.error;
    }
  } catch {
    // Un proxy puede devolver HTML; el estado HTTP sigue siendo útil para informar.
  }

  throw new Error(mensaje);
}

export async function pedirJson<T>(url: string): Promise<T> {
  const respuesta = await pedir(url);
  // La validación de la forma del JSON queda para v2; aquí solo comprobamos el resultado HTTP.
  return respuesta.json();
}

// Un catch recibe unknown: lo que se lanzó puede no ser un Error.
export function mensajeDeError(fallo: unknown, porDefecto = "Error inesperado"): string {
  if (fallo instanceof Error) return fallo.message;
  return porDefecto;
}
