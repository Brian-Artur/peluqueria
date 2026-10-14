import type { CambioTiempo, TiempoEmpleado } from "@peluqueria/compartido";

function fechaLocal(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function textoValor(valor: number | null): string {
  if (valor === null) return "la del servicio";
  return `${valor} min`;
}

export function textoCambioTiempo(cambio: CambioTiempo): string {
  const campo = cambio.campo === "duracion" ? "duración" : "margen";
  const hora = new Date(cambio.cambiado_en).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
  return `${cambio.servicio_nombre} · ${campo}: ${textoValor(cambio.valor_anterior)} → ${textoValor(cambio.valor_nuevo)} · ${cambio.usuario_nombre} · ${fechaLocal(cambio.cambiado_en)} ${hora}`;
}

export function textoUltimoCambio(cambio: NonNullable<TiempoEmpleado["ultimo_cambio"]>): string {
  return `${cambio.usuario_nombre}, ${fechaLocal(cambio.cambiado_en)}`;
}
