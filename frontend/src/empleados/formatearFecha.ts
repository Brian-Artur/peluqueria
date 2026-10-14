export function formatearFecha(fecha: string): string {
  const [ano, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${ano}`;
}
