import { describe, expect, it } from "vitest";
import { esquemaCliente, esquemaDatosCliente } from "./cliente";

describe("el contrato de cliente", () => {
  const datos = {
    nombre: "Ana García",
    telefono: "600123456",
    email: "ana@example.com",
    notas: "Prefiere citas por la tarde",
  };

  it("acepta los datos completos y la respuesta de la API", () => {
    expect(esquemaDatosCliente.parse(datos)).toEqual(datos);
    const cliente = { id: 1, ...datos };
    expect(esquemaCliente.parse(cliente)).toEqual(cliente);
  });

  it("acepta una respuesta con los campos opcionales a null", () => {
    const cliente = { id: 1, nombre: "Ana", telefono: null, email: null, notas: null };
    expect(esquemaCliente.parse(cliente)).toEqual(cliente);
  });

  it("recorta los espacios de los campos sin cambiar su contenido interior", () => {
    expect(esquemaDatosCliente.parse({
      nombre: "  Ana García  ",
      telefono: "  600 123 456  ",
      email: "  ana@example.com  ",
      notas: "  Prefiere citas por la tarde  ",
    })).toEqual({ ...datos, telefono: "600 123 456" });
  });

  it.each([
    { motivo: "omitidos", campos: {} },
    { motivo: "vacíos", campos: { telefono: "", email: "", notas: "" } },
    { motivo: "con espacios", campos: { telefono: "  ", email: "  ", notas: "  " } },
    { motivo: "a null", campos: { telefono: null, email: null, notas: null } },
  ])("convierte los campos opcionales $motivo a null", ({ campos }) => {
    expect(esquemaDatosCliente.parse({ nombre: "Ana", ...campos })).toEqual({
      nombre: "Ana", telefono: null, email: null, notas: null,
    });
  });

  it("permite volver a validar los datos que el formulario ya ha normalizado", () => {
    const normalizados = esquemaDatosCliente.parse({ nombre: "  Ana  ", email: "" });
    expect(esquemaDatosCliente.parse(normalizados)).toEqual(normalizados);
  });

  it("rechaza un cuerpo que no sea un objeto con un mensaje en español", () => {
    const resultado = esquemaDatosCliente.safeParse(null);
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toBe("Los datos del cliente deben ser un objeto");
    }
  });

  it.each(["", "   "])("rechaza un nombre vacío (%j) con un mensaje en español", (nombre) => {
    const resultado = esquemaDatosCliente.safeParse({ ...datos, nombre });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toBe("El nombre es obligatorio");
    }
  });

  it.each(["ana", "ana@", "ana@example", "ana @example.com"])("rechaza el email %j", (email) => {
    const resultado = esquemaDatosCliente.safeParse({ ...datos, email });
    expect(resultado.success).toBe(false);
    if (!resultado.success) {
      expect(resultado.error.issues[0].message).toBe("El email no es válido");
    }
  });

  it("acepta los límites de longitud", () => {
    expect(esquemaDatosCliente.safeParse({
      ...datos,
      nombre: "a".repeat(120),
      telefono: "1".repeat(20),
      notas: "a".repeat(1000),
    }).success).toBe(true);
  });

  it.each([
    { motivo: "nombre ausente", cambio: { nombre: undefined } },
    { motivo: "nombre a null", cambio: { nombre: null } },
    { motivo: "nombre demasiado largo", cambio: { nombre: "a".repeat(121) } },
    { motivo: "teléfono demasiado largo", cambio: { telefono: "1".repeat(21) } },
    { motivo: "email demasiado largo", cambio: { email: `${"a".repeat(250)}@example.com` } },
    { motivo: "notas demasiado largas", cambio: { notas: "a".repeat(1001) } },
    { motivo: "teléfono numérico", cambio: { telefono: 600123456 } },
    { motivo: "email numérico", cambio: { email: 123 } },
    { motivo: "notas numéricas", cambio: { notas: 123 } },
  ])("rechaza $motivo", ({ cambio }) => {
    expect(esquemaDatosCliente.safeParse({ ...datos, ...cambio }).success).toBe(false);
  });
});
