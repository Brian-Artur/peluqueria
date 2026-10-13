import { describe, expect, it } from "vitest";
import {
  esquemaCredenciales, esquemaRol, esquemaUsuarioSesion, esquemaUsuario,
  esquemaCrearUsuario, esquemaEditarUsuario, esquemaContrasenaNueva, esquemaCambiarMiContrasena,
} from "./usuario";

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

describe("los contratos de gestión de usuarios", () => {
  const datos = { nombre_usuario: "ana.p_2-", nombre: "Ana", rol: "admin", contrasena: "demo1234" };

  it("recorta nombres y conserva la contraseña literalmente", () => {
    expect(esquemaCrearUsuario.parse({ ...datos, nombre_usuario: " ana.p_2- ", nombre: " Ana ", contrasena: " clave12 " }))
      .toEqual({ ...datos, contrasena: " clave12 " });
  });

  it.each(["ab", "a".repeat(51), "Ana", "ana pérez", "ana@p", "ábc", "", "ana\npe"])(
    "rechaza el nombre de usuario %j", (nombre_usuario) => {
      expect(esquemaCrearUsuario.safeParse({ ...datos, nombre_usuario }).success).toBe(false);
    }
  );

  it.each(["abc", "a".repeat(50)])("admite los límites del usuario: %s", (nombre_usuario) => {
    expect(esquemaCrearUsuario.safeParse({ ...datos, nombre_usuario }).success).toBe(true);
  });

  it.each([7, 201])("rechaza una contraseña de %i caracteres en alta y cambio", (longitud) => {
    const contrasena = "a".repeat(longitud);
    expect(esquemaCrearUsuario.safeParse({ ...datos, contrasena }).success).toBe(false);
    expect(esquemaContrasenaNueva.safeParse({ contrasena }).success).toBe(false);
    expect(esquemaCambiarMiContrasena.safeParse({ actual: "demo1234", nueva: contrasena }).success).toBe(false);
  });

  it.each([8, 200])("admite una contraseña de %i caracteres en alta y cambio", (longitud) => {
    const contrasena = "a".repeat(longitud);
    expect(esquemaCrearUsuario.safeParse({ ...datos, contrasena }).success).toBe(true);
    expect(esquemaContrasenaNueva.parse({ contrasena })).toEqual({ contrasena });
    expect(esquemaCambiarMiContrasena.parse({ actual: " vieja ", nueva: contrasena }))
      .toEqual({ actual: " vieja ", nueva: contrasena });
  });

  it.each([{}, { ...datos, nombre: "  " }, { ...datos, nombre: "a".repeat(121) },
    { ...datos, rol: "invitado" }, { ...datos, contrasena: 12345678 }])("rechaza un alta inválida: %j", (entrada) => {
    expect(esquemaCrearUsuario.safeParse(entrada).success).toBe(false);
  });

  it("editar exige nombre, rol y un booleano activo; excluye contraseña y usuario", () => {
    expect(esquemaEditarUsuario.parse({ ...datos, activo: false })).toEqual({ nombre: "Ana", rol: "admin", activo: false });
    expect(esquemaEditarUsuario.safeParse({ nombre: "Ana", rol: "admin", activo: 1 }).success).toBe(false);
    expect(esquemaEditarUsuario.safeParse({ nombre: "Ana", rol: "admin" }).success).toBe(false);
  });

  it("la contraseña actual es obligatoria y admite una contraseña antigua corta", () => {
    expect(esquemaCambiarMiContrasena.safeParse({ actual: "", nueva: "demo1234" }).success).toBe(false);
    expect(esquemaCambiarMiContrasena.safeParse({ actual: "a".repeat(201), nueva: "demo1234" }).success).toBe(false);
    expect(esquemaCambiarMiContrasena.safeParse({ actual: "vieja", nueva: "demo1234" }).success).toBe(true);
  });

  it("la respuesta pública valida ISO y booleano y nunca incluye el hash", () => {
    const usuario = { id: 1, nombre_usuario: "ana", nombre: "Ana", rol: "admin", activo: true, creado_en: "2026-10-13T10:00:00.000Z" };
    expect(esquemaUsuario.parse({ ...usuario, hash_contrasena: "privado" })).toEqual(usuario);
    expect(esquemaUsuario.safeParse({ ...usuario, creado_en: "2026-10-13 10:00:00" }).success).toBe(false);
    expect(esquemaUsuario.safeParse({ ...usuario, activo: 1 }).success).toBe(false);
  });
});
