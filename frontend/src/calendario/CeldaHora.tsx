import { useState, type MouseEvent, type ReactElement } from "react";
import { FRANJAS_POR_HORA, MINUTOS_FRANJA } from "./constantes";
import { mismoDia } from "./fechas";
import { franjaEnPosicion } from "./posicion";
import { useSesion } from "../sesion/useSesion";
import styles from "./CeldaHora.module.css";

type Props = {
  dia: Date;
  hora: number;
  columna: number;
  filaInicio: number;
  huecoSeleccionado: Date | null;
  onSeleccionarHueco: (dia: Date, hora: number, minuto: number) => void;
};

function franjaDelEvento(evento: MouseEvent<HTMLDivElement>): number {
  // currentTarget mantiene la referencia a la celda aunque el clic caiga en una banda.
  const limites = evento.currentTarget.getBoundingClientRect();
  const desplazamiento = evento.clientY - limites.top;
  return franjaEnPosicion(desplazamiento, limites.height);
}

function CeldaHora({
  dia,
  hora,
  columna,
  filaInicio,
  huecoSeleccionado,
  onSeleccionarHueco,
}: Props): ReactElement {
  const { puede } = useSesion();
  const puedeGestionar = puede("citas:gestionar");
  const [franjaBajoRaton, setFranjaBajoRaton] = useState<number | null>(null);
  let franjaSeleccionada: number | null = null;
  if (puedeGestionar && huecoSeleccionado !== null
    && mismoDia(dia, huecoSeleccionado)
    && huecoSeleccionado.getHours() === hora) {
    franjaSeleccionada = huecoSeleccionado.getMinutes() / MINUTOS_FRANJA;
  }

  const actualizarFranja = (evento: MouseEvent<HTMLDivElement>): void => {
    if (!puedeGestionar) return;
    setFranjaBajoRaton(franjaDelEvento(evento));
  };

  const seleccionarFranja = (evento: MouseEvent<HTMLDivElement>): void => {
    if (!puedeGestionar) return;
    const minuto = franjaDelEvento(evento) * MINUTOS_FRANJA;
    onSeleccionarHueco(dia, hora, minuto);
  };

  return (
    <div
      className={puedeGestionar ? `${styles.celda} ${styles.editable}` : styles.celda}
      style={{ gridColumn: columna, gridRow: `${filaInicio} / span ${FRANJAS_POR_HORA}` }}
      onMouseEnter={actualizarFranja}
      onMouseMove={actualizarFranja}
      onMouseLeave={() => setFranjaBajoRaton(null)}
      onClick={seleccionarFranja}
    >
      {puedeGestionar && franjaBajoRaton !== null && (
        <div
          className={styles.banda}
          style={{
            top: `${franjaBajoRaton / FRANJAS_POR_HORA * 100}%`,
            height: `${100 / FRANJAS_POR_HORA}%`,
          }}
        />
      )}
      {franjaSeleccionada !== null && (
        <div
          className={`${styles.banda} ${styles.seleccionada}`}
          style={{
            top: `${franjaSeleccionada / FRANJAS_POR_HORA * 100}%`,
            height: `${100 / FRANJAS_POR_HORA}%`,
          }}
        />
      )}
    </div>
  );
}

export default CeldaHora;
