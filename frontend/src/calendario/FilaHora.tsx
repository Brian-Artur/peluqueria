import type { ReactElement } from "react";
import { FRANJAS_POR_HORA, HORA_APERTURA } from "./constantes";
import CeldaHora from "./CeldaHora";
import styles from "./FilaHora.module.css";

type Props = {
  hora: number;
  dias: Date[];
  huecoSeleccionado: Date | null;
  onSeleccionarHueco: (dia: Date, hora: number, minuto: number) => void;
};

function FilaHora({ hora, dias, huecoSeleccionado, onSeleccionarHueco }: Props): ReactElement {
  const filaInicio = (hora - HORA_APERTURA) * FRANJAS_POR_HORA + 2;

  return (
    <>
      <div
        className={styles.etiquetaHora}
        style={{ gridRow: `${filaInicio} / span ${FRANJAS_POR_HORA}` }}
      >
        {hora}:00
      </div>

      {dias.map((dia, indice) => (
        <CeldaHora
          key={dia.getTime()}
          dia={dia}
          hora={hora}
          columna={indice + 2}
          filaInicio={filaInicio}
          huecoSeleccionado={huecoSeleccionado}
          onSeleccionarHueco={onSeleccionarHueco}
        />
      ))}
    </>
  );
}

export default FilaHora;
