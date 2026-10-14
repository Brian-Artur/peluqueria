const formatoEuro = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });

export function formatearPrecio(precio: string): string {
  return formatoEuro.format(Number(precio));
}
