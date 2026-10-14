import type { ReactElement } from "react";
import type { DiaResuelto } from "@peluqueria/compartido";
import { MINUTOS_FRANJA } from "./constantes";
import MiniCalendario from "./MiniCalendario";
import styles from "./SelectorFechaHora.module.css";

type Props = {
  valor: Date;
  horario: DiaResuelto[];
  onCambiar: (fecha: Date) => void;
};

const HORAS = Array.from({ length: 24 }, (_, hora) => hora);

const MINUTOS = Array.from(
  { length: 60 / MINUTOS_FRANJA },
  (_, indice) => indice * MINUTOS_FRANJA
);

function SelectorFechaHora({ valor, horario, onCambiar }: Props): ReactElement {
  const minutosVisibles = Math.floor(valor.getMinutes() / MINUTOS_FRANJA) * MINUTOS_FRANJA;

  function cambiarHora(hora: number, minutos: number): void {
    const nuevaFecha = new Date(valor);
    nuevaFecha.setHours(hora, minutos, 0, 0);
    onCambiar(nuevaFecha);
  }

  return (
    <div className={styles.selector}>
      <MiniCalendario valor={valor} horario={horario} onCambiar={onCambiar} />
      <div className={styles.hora}>
        <label className={styles.campo}>
          Hora
          <select
            value={valor.getHours()}
            onChange={(evento) => cambiarHora(Number(evento.target.value), minutosVisibles)}
          >
            {HORAS.map((hora) => (
              <option key={hora} value={hora}>{String(hora).padStart(2, "0")}</option>
            ))}
          </select>
        </label>
        <label className={styles.campo}>
          Minutos
          <select
            value={minutosVisibles}
            onChange={(evento) => cambiarHora(valor.getHours(), Number(evento.target.value))}
          >
            {MINUTOS.map((minutos) => (
              <option key={minutos} value={minutos}>{String(minutos).padStart(2, "0")}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export default SelectorFechaHora;
