import { describe, expect, it } from "vitest";
import {
  esquemaBaja, esquemaCompetencias, esquemaCrearEmpleado, esquemaDatosEmpleado, esquemaEmpleado,
  esquemaEmpleadoResumen, esquemaNivel, esquemaNuevoContrato, esquemaTipoContrato,
} from "./empleado";

const contrato = { tipo: "plantilla", desde: "2026-10-14", tutor_id: null, empresa: null };
const datos = { nombre: "Ana", telefono: null, email: null };

describe("contratos HTTP de empleados", () => {
  it("comparte la normalización del teléfono, limpia textos y admite desvincular el usuario", () => {
    expect(esquemaDatosEmpleado.parse({ nombre: " Ana ", telefono: "+34 600 111 222", email: " ana@example.com ", usuario_id: null }))
      .toEqual({ nombre: "Ana", telefono: "+34600111222", email: "ana@example.com", usuario_id: null });
    expect(esquemaDatosEmpleado.parse({ nombre: "Ana", telefono: "", email: "" })).toEqual(datos);
    expect(esquemaDatosEmpleado.parse({ nombre: "Ana" })).toEqual(datos);
    expect(esquemaCrearEmpleado.parse({ ...datos, contrato })).toEqual({ ...datos, contrato });
  });

  it.each([
    { nombre: " " }, { nombre: "a".repeat(121) }, { telefono: "600111222" }, { telefono: "+34123" },
    { email: "no-es-email" }, { email: "a".repeat(255) }, { usuario_id: 0 }, { usuario_id: "1" },
  ])("rechaza datos inválidos: %j", (cambio) => {
    expect(esquemaDatosEmpleado.safeParse({ ...datos, ...cambio }).success).toBe(false);
  });

  it("no admite crear un empleado sin contrato inicial", () => {
    expect(esquemaCrearEmpleado.safeParse(datos).success).toBe(false);
  });

  it("explica en español los cuerpos con forma incorrecta", () => {
    for (const [esquema, entrada, mensaje] of [
      [esquemaDatosEmpleado, null, "Los datos del empleado deben ser un objeto"],
      [esquemaCrearEmpleado, null, "Los datos del empleado deben ser un objeto"],
      [esquemaNuevoContrato, null, "Los datos del contrato deben ser un objeto"],
      [esquemaBaja, null, "La baja debe ser un objeto con fecha"],
      [esquemaCompetencias, {}, "Las competencias deben ser una lista"],
    ] as const) {
      const resultado = esquema.safeParse(entrada);
      if (resultado.success) throw new Error("Debería rechazar el cuerpo");
      expect(resultado.error.issues[0].message).toBe(mensaje);
    }
  });

  it.each(["2026-02-29", "2026-04-31", "14-10-2026", "2026-1-01", "2026-10-14T00:00:00Z", ""])(
    "rechaza el día inválido %s sin convertirlo en instante", (fecha) => {
      expect(esquemaNuevoContrato.safeParse({ ...contrato, desde: fecha }).success).toBe(false);
      expect(esquemaBaja.safeParse({ fecha }).success).toBe(false);
    }
  );

  it("admite años bisiestos y conserva el día como cadena", () => {
    expect(esquemaBaja.parse({ fecha: "2028-02-29" })).toEqual({ fecha: "2028-02-29" });
    expect(esquemaNuevoContrato.parse({ tipo: "prueba", desde: "2026-03-29" }))
      .toEqual({ ...contrato, tipo: "prueba", desde: "2026-03-29" });
  });

  it("exige empresa solo en externos y tutor solo en prácticas", () => {
    expect(esquemaNuevoContrato.parse({ ...contrato, tipo: "externo", empresa: " Láser Demo " }).empresa).toBe("Láser Demo");
    expect(esquemaNuevoContrato.parse({ ...contrato, tipo: "practicas", tutor_id: 2 }).tutor_id).toBe(2);
    expect(esquemaNuevoContrato.safeParse({ ...contrato, tipo: "practicas" }).success).toBe(true);
    for (const empresa of [undefined, null, "", "  ", "a".repeat(121)]) {
      expect(esquemaNuevoContrato.safeParse({ ...contrato, tipo: "externo", empresa }).success).toBe(false);
    }
    for (const tipo of ["plantilla", "prueba", "practicas"]) {
      expect(esquemaNuevoContrato.safeParse({ ...contrato, tipo, empresa: "Empresa" }).success).toBe(false);
    }
    for (const tipo of ["plantilla", "prueba", "externo"]) {
      expect(esquemaNuevoContrato.safeParse({ ...contrato, tipo, tutor_id: 2, empresa: tipo === "externo" ? "Empresa" : null }).success).toBe(false);
    }
    const resultado = esquemaNuevoContrato.safeParse({ ...contrato, tipo: "externo" });
    if (resultado.success) throw new Error("Debería exigir empresa");
    expect(resultado.error.issues[0].message).toBe("La empresa es obligatoria para un contrato externo");
  });

  it("valida niveles, tipos e ids y rechaza servicios duplicados", () => {
    expect(esquemaTipoContrato.options).toEqual(["plantilla", "prueba", "practicas", "externo"]);
    expect(esquemaNivel.options).toEqual(["aprendiz", "autonomo", "experto"]);
    expect(esquemaCompetencias.parse([])).toEqual([]);
    expect(esquemaCompetencias.safeParse([{ servicio_id: 1, nivel: "aprendiz" }, { servicio_id: 2, nivel: "experto" }]).success).toBe(true);
    expect(esquemaCompetencias.safeParse([{ servicio_id: 1, nivel: "aprendiz" }, { servicio_id: 1, nivel: "experto" }]).success).toBe(false);
    for (const competencia of [{ servicio_id: 0, nivel: "aprendiz" }, { servicio_id: 1, nivel: "maestro" }]) {
      expect(esquemaCompetencias.safeParse([competencia]).success).toBe(false);
    }
  });

  it("valida lista y ficha con historial, usuario y competencias", () => {
    const resumen = { ...datos, id: 1, activo: true, contrato_vigente: "plantilla", num_competencias: 1 };
    expect(esquemaEmpleadoResumen.parse(resumen)).toEqual(resumen);
    expect(esquemaEmpleadoResumen.safeParse({ ...resumen, activo: false, contrato_vigente: null }).success).toBe(true);
    const ficha = {
      ...resumen, usuario_id: null, usuario_nombre: null,
      contratos: [{ ...contrato, id: 1, hasta: null, tutor_nombre: null }],
      competencias: [{ servicio_id: 1, nivel: "experto" }],
    };
    expect(esquemaEmpleado.parse(ficha)).toEqual(ficha);
  });
});
