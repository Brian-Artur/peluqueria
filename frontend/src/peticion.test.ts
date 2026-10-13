import { afterEach, describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { alPerderSesion, pedir, pedirJson, esAbortada, mensajeDeError } from "./peticion";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
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

describe("sesión perdida", () => {
  it.each([
    { url: "/api/citas", opciones: undefined },
    { url: "/api/sesion", opciones: undefined },
    { url: "/api/sesion", opciones: { method: "DELETE" } },
    { url: "/api/clientes", opciones: { method: "POST" } },
  ])("avisa ante un 401 en $url con $opciones y conserva el mensaje", async ({ url, opciones }) => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: "Sesión necesaria" }), { status: 401 }),
    ));
    const olvidarUsuario = vi.fn<() => void>();
    const dejarDeEscuchar = alPerderSesion(olvidarUsuario);
    try {
      await expect(pedir(url, opciones)).rejects.toThrow("Sesión necesaria");
      expect(olvidarUsuario).toHaveBeenCalledOnce();
    } finally {
      dejarDeEscuchar();
    }
  });

  it.each(["POST", "post"])("no pierde sesión ante credenciales incorrectas (%s)", async (method) => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: "Usuario o contraseña incorrectos" }), { status: 401 }),
    ));
    const olvidarUsuario = vi.fn<() => void>();
    const dejarDeEscuchar = alPerderSesion(olvidarUsuario);
    try {
      await expect(pedirJson("/api/sesion", z.unknown(), { method }))
        .rejects.toThrow("Usuario o contraseña incorrectos");
      expect(olvidarUsuario).not.toHaveBeenCalled();
    } finally {
      dejarDeEscuchar();
    }
  });

  it.each([200, 403, 404, 500])("no pierde sesión por una respuesta %s", async (status) => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status })));
    const olvidarUsuario = vi.fn<() => void>();
    const dejarDeEscuchar = alPerderSesion(olvidarUsuario);
    try {
      if (status === 200) {
        await expect(pedir("/api/citas")).resolves.toBeInstanceOf(Response);
      } else {
        await expect(pedir("/api/citas")).rejects.toThrow(`Error HTTP ${status}`);
      }
      expect(olvidarUsuario).not.toHaveBeenCalled();
    } finally {
      dejarDeEscuchar();
    }
  });

  it("avisa aunque el cuerpo del 401 no sea JSON", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response("Sin sesión", { status: 401 })));
    const olvidarUsuario = vi.fn<() => void>();
    const dejarDeEscuchar = alPerderSesion(olvidarUsuario);
    try {
      await expect(pedir("/api/citas")).rejects.toThrow("Error HTTP 401");
      expect(olvidarUsuario).toHaveBeenCalledOnce();
    } finally {
      dejarDeEscuchar();
    }
  });

  it("no pierde sesión por un 401 de una petición abandonada", async () => {
    const controlador = new AbortController();
    controlador.abort();
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 401 })));
    const olvidarUsuario = vi.fn<() => void>();
    const dejarDeEscuchar = alPerderSesion(olvidarUsuario);
    try {
      await expect(pedir("/api/sesion", { signal: controlador.signal })).rejects.toBe(controlador.signal.reason);
      expect(olvidarUsuario).not.toHaveBeenCalled();
    } finally {
      dejarDeEscuchar();
    }
  });

  it("permite retirar el registro sin borrar uno posterior", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockImplementation(async () => new Response(null, { status: 401 })));
    const anterior = vi.fn<() => void>();
    const actual = vi.fn<() => void>();
    const retirarAnterior = alPerderSesion(anterior);
    const retirarActual = alPerderSesion(actual);
    retirarAnterior();
    try {
      await expect(pedir("/api/citas")).rejects.toThrow("Error HTTP 401");
      expect(anterior).not.toHaveBeenCalled();
      expect(actual).toHaveBeenCalledOnce();
      retirarActual();
      await expect(pedir("/api/citas")).rejects.toThrow("Error HTTP 401");
      expect(actual).toHaveBeenCalledOnce();
    } finally {
      retirarActual();
    }
  });
});

describe("pedirJson", () => {
  it("envía un cuerpo JSON y valida la respuesta de un alta", async () => {
    const fetchSimulado = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 8 }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchSimulado);
    const opciones: RequestInit = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: "Ana", telefono: null, email: null, notas: null }),
    };

    await expect(pedirJson("/api/clientes", z.object({ id: z.number() }), opciones))
      .resolves.toEqual({ id: 8 });
    expect(fetchSimulado).toHaveBeenCalledExactlyOnceWith("/api/clientes", opciones);
  });

  it("devuelve el JSON de una respuesta correcta", async () => {
    const cuerpo = { id: 1 };
    const respuesta = new Response(JSON.stringify(cuerpo), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const fetchSimulado = vi.fn<typeof fetch>().mockResolvedValue(respuesta);
    vi.stubGlobal("fetch", fetchSimulado);

    await expect(pedirJson("/api/citas/1", z.object({ id: z.number() }))).resolves.toEqual(cuerpo);
    expect(fetchSimulado).toHaveBeenCalledExactlyOnceWith("/api/citas/1", undefined);
  });

  it("relanza la cancelación al leer el cuerpo de una respuesta correcta", async () => {
    const fallo = new DOMException("La petición fue cancelada", "AbortError");
    const respuesta = new Response(null, { status: 200 });
    vi.spyOn(respuesta, "json").mockRejectedValue(fallo);
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(respuesta));

    await expect(pedirJson("/api/clientes", z.unknown())).rejects.toBe(fallo);
  });

  it("rechaza una respuesta 200 con una forma incorrecta y registra el detalle de Zod", async () => {
    const respuesta = new Response(JSON.stringify({ id: "1" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(respuesta));
    const registrarError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(pedirJson("/api/citas/1", z.object({ id: z.number() }))).rejects.toThrow(
      "El servidor devolvió datos con una forma inesperada (/api/citas/1)",
    );
    expect(registrarError).toHaveBeenCalledExactlyOnceWith(
      "Respuesta inválida (/api/citas/1)", expect.any(z.ZodError),
    );
  });
});

describe.each([
  { nombre: "pedir", ejecutar: pedir },
  { nombre: "pedirJson", ejecutar: (url: string, opciones?: RequestInit): Promise<unknown> => pedirJson(url, z.unknown(), opciones) },
])("$nombre ante un fallo", ({ ejecutar }) => {
  it("relanza la cancelación de fetch sin convertirla en un error de conexión", async () => {
    const controlador = new AbortController();
    const fetchSimulado = vi.fn<typeof fetch>().mockImplementation((_url, opciones) => {
      return new Promise<Response>((_resolve, reject) => {
        opciones?.signal?.addEventListener("abort", () => reject(opciones.signal?.reason), { once: true });
      });
    });
    vi.stubGlobal("fetch", fetchSimulado);

    const peticion = ejecutar("/api/clientes", { signal: controlador.signal });
    controlador.abort();

    await expect(peticion).rejects.toBe(controlador.signal.reason);
    expect(esAbortada(controlador.signal.reason)).toBe(true);
    expect(mensajeDeError(controlador.signal.reason)).not.toContain("No se pudo conectar");
  });

  it("relanza la cancelación al leer el cuerpo de una respuesta de error", async () => {
    const fallo = new DOMException("La petición fue cancelada", "AbortError");
    const respuesta = new Response(null, { status: 404 });
    vi.spyOn(respuesta, "json").mockRejectedValue(fallo);
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(respuesta));

    await expect(ejecutar("/api/clientes")).rejects.toBe(fallo);
  });

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

describe("esAbortada", () => {
  it("reconoce una DOMException AbortError", () => {
    expect(esAbortada(new DOMException("Cancelada", "AbortError"))).toBe(true);
  });

  it.each([null, undefined, "AbortError", new Error("AbortError"), new DOMException("Fallo", "NetworkError")])(
    "no confunde otros fallos con una cancelación: %s", (fallo) => {
      expect(esAbortada(fallo)).toBe(false);
    },
  );
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
