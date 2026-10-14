import type { CompetenciaResumen, EmpleadoResumen, Nivel, Servicio } from "@peluqueria/compartido";
import { agruparServicios, type GrupoServicios } from "../catalogo/agruparServicios";

type FilaCompetencias = { empleado: EmpleadoResumen; niveles: (Nivel | null)[] };
export type AvisoHueco = "Nadie" | "Sin experto" | null;
export type MatrizCompetencias = {
  grupos: GrupoServicios[];
  servicios: Servicio[];
  filas: FilaCompetencias[];
  avisos: AvisoHueco[];
};

export function construirMatriz(
  empleados: EmpleadoResumen[], servicios: Servicio[], competencias: CompetenciaResumen[],
): MatrizCompetencias {
  const grupos = agruparServicios(servicios.filter((servicio) => servicio.activo));
  const columnas = grupos.flatMap((grupo) => grupo.servicios);
  const porEmpleado = new Map<number, Map<number, Nivel>>();
  for (const competencia of competencias) {
    let niveles = porEmpleado.get(competencia.empleado_id);
    if (!niveles) {
      niveles = new Map();
      porEmpleado.set(competencia.empleado_id, niveles);
    }
    niveles.set(competencia.servicio_id, competencia.nivel);
  }
  const activos = empleados.filter((empleado) => empleado.activo);
  const filas = activos.map((empleado) => ({
    empleado,
    niveles: columnas.map((servicio) => porEmpleado.get(empleado.id)?.get(servicio.id) ?? null),
  }));
  const avisos = columnas.map((_, indice): AvisoHueco => {
    if (filas.some((fila) => fila.niveles[indice] === "experto")) return null;
    if (filas.some((fila) => fila.niveles[indice] !== null)) return "Sin experto";
    return "Nadie";
  });
  return { grupos, servicios: columnas, filas, avisos };
}
