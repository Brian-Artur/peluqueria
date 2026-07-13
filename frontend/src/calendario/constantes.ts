export const HORA_APERTURA = 9;
export const HORA_CIERRE = 20;
export const MINUTOS_FRANJA = 5;

export const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export const FRANJAS = ((HORA_CIERRE - HORA_APERTURA) * 60) / MINUTOS_FRANJA;
export const FRANJAS_POR_HORA = 60 / MINUTOS_FRANJA;

export const HORAS = Array.from(
  { length: HORA_CIERRE - HORA_APERTURA },
  (_, i) => HORA_APERTURA + i
); // [9, 10, 11, ..., 19]