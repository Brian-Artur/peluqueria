import type { NuevoContrato, TipoContrato } from "@peluqueria/compartido";

export type FormularioContrato = { tipo: TipoContrato; desde: string; tutor_id: string; empresa: string };

export function datosContrato(valor: FormularioContrato): NuevoContrato {
  return {
    tipo: valor.tipo, desde: valor.desde,
    tutor_id: valor.tipo === "practicas" && valor.tutor_id !== "" ? Number(valor.tutor_id) : null,
    empresa: valor.tipo === "externo" ? valor.empresa : null,
  };
}
