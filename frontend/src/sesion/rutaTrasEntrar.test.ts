import { describe, expect, it } from "vitest";
import { rutaTrasEntrar } from "./rutaTrasEntrar";

describe("rutaTrasEntrar", () => {
  it.each(["/agenda", "/clientes/8", "/clientes/nuevo", "/clientes?buscar=Ana#ficha"])(
    "conserva la ruta interna %s", (volverA) => {
      expect(rutaTrasEntrar({ volverA })).toBe(volverA);
    },
  );

  it.each([
    null, undefined, {}, "texto", { volverA: 8 }, { volverA: "" },
    { volverA: "https://otro.example" }, { volverA: "//otro.example" },
    { volverA: "/\\otro.example" }, { volverA: "clientes" },
    { volverA: "/entrar" }, { volverA: "/entrar/" }, { volverA: "/entrar?origen=agenda#formulario" },
  ])("vuelve a agenda si el destino no sirve: %j", (estado) => {
    expect(rutaTrasEntrar(estado)).toBe("/agenda");
  });
});
