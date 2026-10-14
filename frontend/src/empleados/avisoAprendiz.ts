import type { Dificultad, Nivel } from "@peluqueria/compartido";

export function necesitaAvisoAprendiz(nivel: Nivel | null, dificultad: Dificultad): boolean {
  return nivel === "aprendiz" && dificultad === "alta";
}
