import { describe, expect, it } from "vitest";
import type { Rol } from "@peluqueria/compartido";
import { textoRol } from "./textoRol";

describe("texto del rol", () => {
  const casos: [Rol, string][] = [["admin", "Admin"], ["encargado", "Encargado"], ["recepcion", "Recepción"], ["empleado", "Empleado"]];
  it.each(casos)("muestra %s como %s", (rol, texto) => {
    expect(textoRol(rol)).toBe(texto);
  });
});
