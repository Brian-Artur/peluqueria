import { afterEach, describe, it, expect, vi } from "vitest";
import { pedir, pedirJson, mensajeDeError } from "./peticion";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pedir", () => {
  it("devuelve la respuesta correcta y pasa la URL y las opciones a fetch", async () => {
    const respuesta = new Response(null, { status: 204 });
    const fetchSimulado = vi.fn<typeof fetch>().mockResolvedValue(respuesta);
    vi.stubGlobal("fetch", fetchSimulado);
    const opciones: RequestInit = { method: "POST", body: "{}" };

    await expect(pedir("/api/citas", opciones)).resolves.toBe(respuesta);
    expect(fetchSimulado).toHaveBeenCalledExactlyOnceWith("/api/citas", opciones);
  });
});

describe("pedirJson", () => {
  it("devuelve el JSON de una respuesta correcta", async () => {
    const cuerpo = { id: 1 };
    const respuesta = new Response(JSON.stringify(cuerpo), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const fetchSimulado = vi.fn<typeof fetch>().mockResolvedValue(respuesta);
    vi.stubGlobal("fetch", fetchSimulado);

    await expect(pedirJson<{ id: number }>("/api/citas/1")).resolves.toEqual(cuerpo);
    expect(fetchSimulado).toHaveBeenCalledExactlyOnceWith("/api/citas/1", undefined);
  });
});

describe.each([
  { nombre: "pedir", ejecutar: pedir },
  { nombre: "pedirJson", ejecutar: pedirJson },
])("$nombre ante un fallo", ({ ejecutar }) => {
  it("lanza el mensaje del backend si el error contiene JSON", async () => {
    const respuesta = new Response(JSON.stringify({ error: "Cita no encontrada" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(respuesta));

    await expect(ejecutar("/api/citas/1")).rejects.toThrow("Cita no encontrada");
  });

  it("lanza Error HTTP 502 si el cuerpo del error es HTML", async () => {
    const respuesta = new Response("<html><body>Bad Gateway</body></html>", {
      status: 502,
      headers: { "Content-Type": "text/html" },
    });
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(respuesta));

    await expect(ejecutar("/api/citas/1")).rejects.toThrow("Error HTTP 502");
  });

  it("lanza el mensaje de conexión si falla la red", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(ejecutar("/api/citas/1")).rejects.toThrow(
      "No se pudo conectar con el servidor. Comprueba la conexión e inténtalo de nuevo.",
    );
  });
});

describe("mensajeDeError", () => {
  it("devuelve el mensaje de un Error", () => {
    expect(mensajeDeError(new Error("Cita no encontrada"))).toBe("Cita no encontrada");
  });

  it("devuelve el mensaje por defecto si el fallo no es un Error", () => {
    expect(mensajeDeError("Cita no encontrada")).toBe("Error inesperado");
  });

  it("devuelve el mensaje alternativo si el fallo no es un Error", () => {
    expect(mensajeDeError(null, "No se pudo guardar")).toBe("No se pudo guardar");
  });
});
