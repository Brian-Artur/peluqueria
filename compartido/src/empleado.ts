import { z } from "zod";
import { esquemaDatosCliente } from "./cliente";

export const esquemaTipoContrato = z.enum(["plantilla", "prueba", "practicas", "externo"], {
  error: "El tipo de contrato debe ser plantilla, prueba, practicas o externo",
});
export const esquemaNivel = z.enum(["aprendiz", "autonomo", "experto"], {
  error: "El nivel debe ser aprendiz, autonomo o experto",
});

const esquemaFecha = z.iso.date({ error: "La fecha debe ser un día válido con formato YYYY-MM-DD" });
const esquemaId = z.number({ error: "El id debe ser un número" })
  .int("El id debe ser entero").positive("El id debe ser positivo");

export const esquemaContrato = z.object({
  id: esquemaId,
  tipo: esquemaTipoContrato,
  desde: esquemaFecha,
  hasta: esquemaFecha.nullable(),
  tutor_id: esquemaId.nullable(),
  tutor_nombre: z.string().nullable(),
  empresa: z.string().nullable(),
});

export const esquemaCompetencia = z.object({
  servicio_id: esquemaId,
  nivel: esquemaNivel,
}, { error: "La competencia debe ser un objeto" });

export const esquemaCompetenciaResumen = esquemaCompetencia.extend({ empleado_id: esquemaId });

export const esquemaEmpleadoResumen = z.object({
  id: esquemaId,
  nombre: z.string(),
  telefono: z.string().nullable(),
  email: z.string().nullable(),
  activo: z.boolean(),
  contrato_vigente: esquemaTipoContrato.nullable(),
  num_competencias: z.number().int().nonnegative(),
});

export const esquemaEmpleado = esquemaEmpleadoResumen.extend({
  usuario_id: esquemaId.nullable(),
  usuario_nombre: z.string().nullable(),
  contratos: z.array(esquemaContrato),
  competencias: z.array(esquemaCompetencia),
});

// Comparte la validación y normalización E.164 que ya utiliza la API de clientes.
export const esquemaDatosEmpleado = z.object({
  ...esquemaDatosCliente.pick({ nombre: true, telefono: true, email: true }).shape,
  usuario_id: esquemaId.nullable().optional(),
}, { error: "Los datos del empleado deben ser un objeto" });

export const esquemaNuevoContrato = z.object({
  tipo: esquemaTipoContrato,
  desde: esquemaFecha,
  tutor_id: esquemaId.nullable().optional().transform((valor) => valor ?? null),
  empresa: z.string({ error: "La empresa debe ser un texto" }).trim()
    .max(120, "La empresa no puede superar los 120 caracteres")
    .nullable().optional().transform((valor) => valor || null),
}, { error: "Los datos del contrato deben ser un objeto" }).superRefine((datos, contexto) => {
  if (datos.tipo === "externo" && datos.empresa === null) {
    contexto.addIssue({ code: "custom", path: ["empresa"], message: "La empresa es obligatoria para un contrato externo" });
  }
  if (datos.tipo !== "externo" && datos.empresa !== null) {
    contexto.addIssue({ code: "custom", path: ["empresa"], message: "Solo un contrato externo puede tener empresa" });
  }
  if (datos.tipo !== "practicas" && datos.tutor_id !== null) {
    contexto.addIssue({ code: "custom", path: ["tutor_id"], message: "Solo un contrato de prácticas puede tener tutor" });
  }
});

export const esquemaCrearEmpleado = esquemaDatosEmpleado.extend({ contrato: esquemaNuevoContrato });
export const esquemaBaja = z.object({ fecha: esquemaFecha }, { error: "La baja debe ser un objeto con fecha" });
export const esquemaCompetencias = z.array(esquemaCompetencia, { error: "Las competencias deben ser una lista" }).refine((competencias) => {
  const servicios = new Set(competencias.map((competencia) => competencia.servicio_id));
  return servicios.size === competencias.length;
}, "No se puede repetir un servicio en las competencias");

export type TipoContrato = z.infer<typeof esquemaTipoContrato>;
export type Nivel = z.infer<typeof esquemaNivel>;
export type Contrato = z.infer<typeof esquemaContrato>;
export type Competencia = z.infer<typeof esquemaCompetencia>;
export type CompetenciaResumen = z.infer<typeof esquemaCompetenciaResumen>;
export type EmpleadoResumen = z.infer<typeof esquemaEmpleadoResumen>;
export type Empleado = z.infer<typeof esquemaEmpleado>;
export type DatosEmpleado = z.infer<typeof esquemaDatosEmpleado>;
export type CrearEmpleado = z.infer<typeof esquemaCrearEmpleado>;
export type NuevoContrato = z.infer<typeof esquemaNuevoContrato>;
export type Baja = z.infer<typeof esquemaBaja>;
export type Competencias = z.infer<typeof esquemaCompetencias>;
