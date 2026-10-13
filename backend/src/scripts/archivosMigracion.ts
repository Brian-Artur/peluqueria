export function ordenarArchivosMigracion(nombres: string[]): string[] {
  const archivos = nombres.filter((nombre) => /^\d{3}-[a-z0-9-]+\.sql$/.test(nombre));
  archivos.sort();

  const numeros = new Set<string>();
  for (const nombre of archivos) {
    const numero = nombre.slice(0, 3);
    if (numeros.has(numero)) {
      throw new Error(`Número de migración duplicado: ${numero}`);
    }
    numeros.add(numero);
  }

  return archivos;
}
