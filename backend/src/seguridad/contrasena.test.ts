import { describe, expect, it } from "vitest";
import { cifrarContrasena, comprobarContrasena } from "./contrasena";

describe("las contraseñas con scrypt", () => {
  it("guarda el formato acordado, con sal de 16 bytes y hash de 64", async () => {
    const guardado = await cifrarContrasena("demo1234");
    const [algoritmo, sal, hash] = guardado.split("$");
    expect(algoritmo).toBe("scrypt");
    expect(Buffer.from(sal!, "base64")).toHaveLength(16);
    expect(Buffer.from(hash!, "base64")).toHaveLength(64);
    expect(guardado).not.toContain("demo1234");
  });

  it("acepta la contraseña correcta y rechaza la incorrecta", async () => {
    const guardado = await cifrarContrasena(" contraseña ñ ");
    await expect(comprobarContrasena(" contraseña ñ ", guardado)).resolves.toBe(true);
    await expect(comprobarContrasena("contraseña ñ", guardado)).resolves.toBe(false);
  });

  it("genera una sal distinta cada vez", async () => {
    const primero = await cifrarContrasena("demo1234");
    const segundo = await cifrarContrasena("demo1234");
    expect(primero).not.toBe(segundo);
  });

  it.each(["", "texto", "scrypt$a$b", "otro$a$b", "scrypt$$", "scrypt$a$b$extra"])(
    "rechaza un formato inválido sin lanzar una excepción: %s", async (guardado) => {
      await expect(comprobarContrasena("demo1234", guardado)).resolves.toBe(false);
    }
  );

  it("rechaza base64 no canónico aunque decodifique a la longitud correcta", async () => {
    const guardado = await cifrarContrasena("demo1234");
    await expect(comprobarContrasena("demo1234", guardado + "!")).resolves.toBe(false);
  });
});
