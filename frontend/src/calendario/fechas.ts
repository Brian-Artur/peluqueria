export function lunesDeEstaSemana(fecha: Date): Date {
  const dia = fecha.getDay();                // 0=Dom, 1=Lun ... 6=Sáb
  const retroceso = dia === 0 ? 6 : dia - 1; // días hasta el lunes anterior
  const lunes = new Date(fecha);             // copia (no mutar el argumento)
  lunes.setDate(lunes.getDate() - retroceso);
  lunes.setHours(0, 0, 0, 0);                // medianoche limpia
  return lunes;                     // Lunes esterilizado
}

export function sumarDias(fecha: Date, dias: number): Date {
  const nueva = new Date(fecha);        // copiar: setDate muta
  nueva.setDate(nueva.getDate() + dias);
  return nueva;
}

export function diasDeLaSemana(lunes: Date): Date[] {
  return Array.from({ length: 7 }, (_, indice) => sumarDias(lunes, indice));
}

export function mismoDia(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export function numeroSemanaISO(fecha: Date): number {
  const jueves = sumarDias(lunesDeEstaSemana(fecha), 3);
  // El jueves fija el año ISO; UTC evita que el cambio de hora altere la cuenta de días.
  const juevesUTC = Date.UTC(jueves.getFullYear(), jueves.getMonth(), jueves.getDate());
  const inicioDelAnioUTC = Date.UTC(jueves.getFullYear(), 0, 1);
  const diasDesdeInicio = (juevesUTC - inicioDelAnioUTC) / 86400000;
  return Math.ceil((diasDesdeInicio + 1) / 7);
}

export function diasDelMes(fecha: Date): (Date | null)[] {
  const anio = fecha.getFullYear();
  const mes = fecha.getMonth();
  const primerDia = new Date(anio, mes, 1);
  const huecosAntes = (primerDia.getDay() + 6) % 7;
  const cantidadDias = new Date(anio, mes + 1, 0).getDate();
  const dias: (Date | null)[] = [];

  for (let hueco = 0; hueco < huecosAntes; hueco += 1) {
    dias.push(null);
  }

  for (let dia = 1; dia <= cantidadDias; dia += 1) {
    dias.push(new Date(anio, mes, dia));
  }

  return dias;
}

export function horaCorta(fecha: Date): string {
  const hora = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  return `${hora}:${minutos}`;
}
