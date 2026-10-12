import type { ReactElement } from "react";
import { NOMBRES_DIA } from "./constantes";
import { numeroSemanaISO } from "./fechas";
import styles from "./CabeceraDias.module.css";

type Props = {
  dias: Date[];
  onAnterior: () => void;
  onSiguiente: () => void;
};

function CabeceraDias({ dias, onAnterior, onSiguiente }: Props): ReactElement {
  const primero = dias[0];
  const ultimo = dias[dias.length - 1];
  const semana = numeroSemanaISO(primero);
  const mismoAnio = primero.getFullYear() === ultimo.getFullYear();
  const mismoMes = mismoAnio && primero.getMonth() === ultimo.getMonth();
  const opcionesInicio: Intl.DateTimeFormatOptions = { day: "numeric" };
  if (!mismoMes) {
    opcionesInicio.month = "short";
  }
  if (!mismoAnio) {
    opcionesInicio.year = "numeric";
  }
  const inicio = primero.toLocaleDateString("es-ES", opcionesInicio);
  const fin = ultimo.toLocaleDateString("es-ES", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <>
      <div className={styles.esquina} title={`Semana ${semana} · ${inicio}–${fin}`}>
        {semana}
      </div>
      {dias.map((dia, indice) => {
        return (
          <div key={dia.getTime()} className={styles.cabeceraDia} style={{ gridColumn: indice + 2 }}>
            {indice === 0 && (
              <button
                type="button"
                className={`${styles.flecha} ${styles.anterior}`}
                onClick={onAnterior}
                aria-label="Semana anterior"
              >
                ‹
              </button>
            )}
            <span className={styles.textoDia}>
              {NOMBRES_DIA[dia.getDay()]} {dia.getDate()}
            </span>
            {indice === dias.length - 1 && (
              <button
                type="button"
                className={`${styles.flecha} ${styles.siguiente}`}
                onClick={onSiguiente}
                aria-label="Semana siguiente"
              >
                ›
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}

export default CabeceraDias;
