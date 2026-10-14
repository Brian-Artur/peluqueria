import { describe, expect, it } from "vitest";
import { esquemaDatosRecurso, esquemaDatosTipoRecurso, esquemaRecurso, esquemaTipoRecurso } from "./recurso";

const datos = { nombre: "Butaca 1", tipo_recurso_id: 1, fuera_de_servicio: false, motivo: null, activo: true };

describe("contratos de tipos y recursos", () => {
  it("recorta nombres y admite activar o desactivar tipos", () => {
    expect(esquemaDatosTipoRecurso.parse({ nombre: " Butaca ", activo: false })).toEqual({ nombre: "Butaca", activo: false });
    expect(esquemaTipoRecurso.parse({ id: 1, nombre: "Butaca", activo: true }).id).toBe(1);
    expect(esquemaDatosRecurso.parse({ ...datos, nombre: " Butaca 1 " })).toEqual(datos);
  });

  it.each(["", " ", "a".repeat(61), null, 1])("rechaza el nombre %j", (nombre) => {
    expect(esquemaDatosTipoRecurso.safeParse({ nombre, activo: true }).success).toBe(false);
    expect(esquemaDatosRecurso.safeParse({ ...datos, nombre }).success).toBe(false);
  });

  it("acepta los límites de nombre y motivo", () => {
    expect(esquemaDatosTipoRecurso.safeParse({ nombre: "a".repeat(60), activo: true }).success).toBe(true);
    expect(esquemaDatosRecurso.safeParse({ ...datos, nombre: "a".repeat(60), fuera_de_servicio: true, motivo: "a".repeat(200) }).success).toBe(true);
  });

  it.each([null, "", "   "])("exige motivo al estar fuera de servicio: %j", (motivo) => {
    const resultado = esquemaDatosRecurso.safeParse({ ...datos, fuera_de_servicio: true, motivo });
    expect(resultado.success).toBe(false);
    if (resultado.success) throw new Error("Falta el motivo");
    expect(resultado.error.issues[0].path).toEqual(["motivo"]);
  });

  it("convierte el motivo vacío a null y recorta un motivo informado", () => {
    expect(esquemaDatosRecurso.parse({ ...datos, motivo: "   " })).toEqual(datos);
    expect(esquemaDatosRecurso.parse({ ...datos, fuera_de_servicio: true, motivo: " En reparación " }).motivo).toBe("En reparación");
  });

  it.each(["a".repeat(201), 3, undefined])("rechaza el motivo %j", (motivo) => {
    expect(esquemaDatosRecurso.safeParse({ ...datos, motivo }).success).toBe(false);
  });

  it.each([0, -1, 1.5, "1", null, undefined])("rechaza el tipo %j", (tipo_recurso_id) => {
    expect(esquemaDatosRecurso.safeParse({ ...datos, tipo_recurso_id }).success).toBe(false);
  });

  it("valida estados y la respuesta sin coerción", () => {
    expect(esquemaDatosRecurso.safeParse({ ...datos, activo: false }).success).toBe(true);
    expect(esquemaDatosRecurso.safeParse({ ...datos, activo: 0 }).success).toBe(false);
    expect(esquemaDatosRecurso.safeParse({ ...datos, fuera_de_servicio: 1 }).success).toBe(false);
    expect(esquemaDatosTipoRecurso.safeParse({ nombre: "Butaca", activo: 1 }).success).toBe(false);
    expect(esquemaDatosRecurso.safeParse(null).success).toBe(false);
    expect(esquemaRecurso.parse({ ...datos, id: 2, tipo_recurso_nombre: "Butaca" }).tipo_recurso_nombre).toBe("Butaca");
    expect(esquemaRecurso.safeParse({ ...datos, id: 2 }).success).toBe(false);
  });
});
