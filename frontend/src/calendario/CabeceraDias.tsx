import type { ReactElement } from "react";
import type { DiaResuelto } from "@peluqueria/compartido";
import { fechaDeDia } from "./horario";
import { NOMBRES_DIA } from "./constantes";
import { numeroSemanaISO } from "./fechas";
import styles from "./CabeceraDias.module.css";

type Props = {
  dias: Date[];
  lunes: Date;
  horario: DiaResuelto[];
  onAnterior: () => void;
  onSiguiente: () => void;
};

function CabeceraDias({ dias, lunes, horario, onAnterior, onSiguiente }: Props): ReactElement {
  const primero = dias[0] ?? lunes;
  const ultimo = dias[dias.length - 1] ?? lunes;
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
        {dias.length === 0 && <button type="button" onClick={onAnterior} aria-label="Semana anterior">‹</button>}
        {semana}
        {dias.length === 0 && <button type="button" onClick={onSiguiente} aria-label="Semana siguiente">›</button>}
      </div>
      {dias.map((dia, indice) => {
        const resuelto = horario.find((elemento) => elemento.fecha === fechaDeDia(dia));
        let titulo: string | undefined;
        if (resuelto?.origen === "excepcion") titulo = resuelto.motivo ?? "Excepción de horario";
        if (resuelto?.origen === "temporada") titulo = resuelto.temporada_nombre ?? "Temporada";
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
              {titulo && <span className={styles.marca} title={titulo} aria-label={titulo}> •</span>}
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
