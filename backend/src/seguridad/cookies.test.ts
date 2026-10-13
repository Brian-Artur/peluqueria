import { afterEach, describe, expect, it, vi } from "vitest";
import { leerCookie, crearCookieSesion, caducarCookieSesion } from "./cookies";

afterEach(() => vi.unstubAllEnvs());

describe("leer cookies sin dependencias", () => {
  it("encuentra la sesión entre varias cookies", () => {
    expect(leerCookie("tema=oscuro; sesion=abc_123-; otra=valor", "sesion")).toBe("abc_123-");
  });

  it.each([undefined, "", "tema=oscuro", "mi_sesion=abc", "sesion", "sesion=%ZZ"])(
    "devuelve null si falta la cookie o es inválida: %s", (cabecera) => {
      expect(leerCookie(cabecera, "sesion")).toBeNull();
    }
  );

  it("conserva los iguales del valor y decodifica los escapes", () => {
    expect(leerCookie("sesion=a%20b==", "sesion")).toBe("a b==");
  });
});

describe("construir Set-Cookie", () => {
  it.each([undefined, "false", "TRUE"])("omite Secure con COOKIE_SEGURA=%s", (valor) => {
    vi.stubEnv("COOKIE_SEGURA", valor);
    expect(crearCookieSesion("abc")).toBe("sesion=abc; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200");
  });

  it("incluye Secure solo al activarlo explícitamente", () => {
    vi.stubEnv("COOKIE_SEGURA", "true");
    expect(crearCookieSesion("abc")).toBe("sesion=abc; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200; Secure");
  });

  it("caduca la cookie con los mismos atributos", () => {
    vi.stubEnv("COOKIE_SEGURA", "true");
    expect(caducarCookieSesion()).toBe("sesion=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Secure");
  });
});
