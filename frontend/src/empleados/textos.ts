import type { Nivel, TipoContrato } from "@peluqueria/compartido";

export const textosContrato: Record<TipoContrato, string> = {
  plantilla: "Plantilla", prueba: "Prueba", practicas: "Prácticas", externo: "Externo",
};
export const textosNivel: Record<Nivel, string> = {
  aprendiz: "Aprendiz", autonomo: "Autónomo", experto: "Experto",
};
export const abreviaturasNivel: Record<Nivel, string> = {
  aprendiz: "A", autonomo: "Au", experto: "E",
};

export function textoNumeroCompetencias(cantidad: number): string {
  if (cantidad === 1) return "1 competencia";
  return `${cantidad} competencias`;
}
