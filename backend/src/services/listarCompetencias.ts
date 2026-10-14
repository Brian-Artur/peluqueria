import type { CompetenciaResumen } from "@peluqueria/compartido";
import { consultarCompetenciasActivas } from "../repositories/competenciaRepository";

export async function listarCompetencias(): Promise<CompetenciaResumen[]> {
  return consultarCompetenciasActivas();
}
