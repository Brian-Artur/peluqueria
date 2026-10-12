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

export function fechaParaInput(iso: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function horaCorta(fecha: Date): string {
  const hora = String(fecha.getHours()).padStart(2, "0");
  const minutos = String(fecha.getMinutes()).padStart(2, "0");
  return `${hora}:${minutos}`;
}
