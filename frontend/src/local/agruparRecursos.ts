import type { Recurso } from "@peluqueria/compartido";

export type GrupoRecursos = {
  tipoId: number;
  nombre: string;
  recursos: Recurso[];
};

export function agruparRecursos(recursos: Recurso[], mostrarBajas: boolean = false): GrupoRecursos[] {
  const porTipo = new Map<number, GrupoRecursos>();
  for (const recurso of recursos) {
    if (!mostrarBajas && !recurso.activo) continue;
    let grupo = porTipo.get(recurso.tipo_recurso_id);
    if (!grupo) {
      grupo = { tipoId: recurso.tipo_recurso_id, nombre: recurso.tipo_recurso_nombre, recursos: [] };
      porTipo.set(grupo.tipoId, grupo);
    }
    grupo.recursos.push(recurso);
  }
  const grupos = Array.from(porTipo.values());
  grupos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es") || a.tipoId - b.tipoId);
  for (const grupo of grupos) {
    grupo.recursos.sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { numeric: true }) || a.id - b.id);
  }
  return grupos;
}
