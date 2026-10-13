export function parsearId(valor: string | string[]): number | null {
  if (typeof valor !== "string") return null;
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}
