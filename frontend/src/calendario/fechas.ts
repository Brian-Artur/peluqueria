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

export function fechaParaInput(iso: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}