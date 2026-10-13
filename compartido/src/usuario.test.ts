import { describe, expect, it } from "vitest";
import { esquemaCredenciales, esquemaRol, esquemaUsuarioSesion } from "./usuario";

describe("los contratos de autenticación", () => {
  it("recorta el usuario y conserva la contraseña literalmente", () => {
    expect(esquemaCredenciales.parse({ nombre_usuario: " admin ", contrasena: " clave " }))
      .toEqual({ nombre_usuario: "admin", contrasena: " clave " });
  });

  it.each([{}, { nombre_usuario: "admin" }, { contrasena: "clave" },
    { nombre_usuario: "  ", contrasena: "clave" }, { nombre_usuario: "admin", contrasena: "" }])(
    "rechaza credenciales incompletas: %j", (datos) => {
      expect(esquemaCredenciales.safeParse(datos).success).toBe(false);
    }
  );

  it("rechaza roles desconocidos", () => {
    expect(esquemaRol.safeParse("invitado").success).toBe(false);
  });

  it("excluye los campos privados del usuario conectado", () => {
    const usuario = { id: 1, nombre: "Ana", nombre_usuario: "ana", rol: "admin" };
    expect(esquemaUsuarioSesion.parse({ ...usuario, hash_contrasena: "privado", activo: 1 }))
      .toEqual(usuario);
  });
});
