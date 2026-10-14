export function calcularDuracionAgendada(
  duracionServicio: number,
  duracionPropia: number | null,
  margenServicio: number,
  margenPropio: number,
): number {
  return (duracionPropia ?? duracionServicio) + margenServicio + margenPropio;
}
