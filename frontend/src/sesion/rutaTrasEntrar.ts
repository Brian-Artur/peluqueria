export function rutaTrasEntrar(estado: unknown): string {
  if (typeof estado !== "object" || estado === null || !("volverA" in estado)) return "/agenda";
  const ruta = estado.volverA;
  // El destino viene del router, pero solo admitimos rutas internas para evitar
  // que un estado manipulado lleve fuera de la aplicación o de vuelta a entrar.
  if (typeof ruta !== "string" || !ruta.startsWith("/") || ruta.startsWith("//") || ruta.includes("\\")) {
    return "/agenda";
  }
  const camino = ruta.split(/[?#]/)[0];
  if (camino === "/entrar" || camino === "/entrar/") return "/agenda";
  return ruta;
}
