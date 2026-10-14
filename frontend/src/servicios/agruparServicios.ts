import type { Servicio } from "@peluqueria/compartido";

export type GrupoServicios = {
  categoriaId: number | null;
  nombre: string;
  servicios: Servicio[];
};

export function agruparServicios(servicios: Servicio[]): GrupoServicios[] {
  const porCategoria = new Map<number | null, GrupoServicios>();
  for (const servicio of servicios) {
    let grupo = porCategoria.get(servicio.categoria_id);
    if (!grupo) {
      grupo = {
        categoriaId: servicio.categoria_id,
        nombre: servicio.categoria_nombre ?? "Sin categoría",
        servicios: [],
      };
      porCategoria.set(servicio.categoria_id, grupo);
    }
    grupo.servicios.push(servicio);
  }
  const grupos = Array.from(porCategoria.values());
  grupos.sort((a, b) => {
    if (a.categoriaId === null) return 1;
    if (b.categoriaId === null) return -1;
    return a.nombre.localeCompare(b.nombre, "es");
  });
  for (const grupo of grupos) {
    grupo.servicios.sort((a, b) => a.nombre.localeCompare(b.nombre, "es") || a.id - b.id);
  }
  return grupos;
}
