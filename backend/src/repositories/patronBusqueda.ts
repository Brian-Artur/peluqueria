export function patronBusqueda(texto: string): string {
  // El escape explícito evita depender del modo SQL que interpreta las barras invertidas.
  const textoEscapado = texto.replace(/[!%_]/g, (caracter) => `!${caracter}`);
  return `%${textoEscapado}%`;
}
