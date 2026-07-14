export function lunesDeEstaSemana(fecha: Date): Date {
  const dia = fecha.getDay();                // 0=Dom, 1=Lun ... 6=Sáb
  const retroceso = dia === 0 ? 6 : dia - 1; // días hasta el lunes anterior
  const lunes = new Date(fecha);             // copia (no mutar el argumento)
  lunes.setDate(lunes.getDate() - retroceso);
  lunes.setHours(0, 0, 0, 0);                // medianoche limpia
  return lunes;                     // Lunes esterilizado
}