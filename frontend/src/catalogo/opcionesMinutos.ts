export function opcionesMinutos(minimo: number, maximo: number): number[] {
  const opciones: number[] = [];
  for (let minutos = minimo; minutos <= maximo; minutos += 5) {
    opciones.push(minutos);
  }
  return opciones;
}
