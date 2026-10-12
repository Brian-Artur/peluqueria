import type { ReactElement } from "react";
import { FRANJAS_POR_HORA, HORA_APERTURA } from "./constantes";
import styles from "./FilaHora.module.css";

type Props = {
  hora: number;
  dias: Date[];
  onSeleccionarHueco: (dia: Date, hora: number) => void;
};

function FilaHora({ hora, dias, onSeleccionarHueco }: Props): ReactElement {
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
        <div
          key={dia.getTime()}
          className={styles.celda}
          style={{ gridColumn: indice + 2, gridRow: `${filaInicio} / span ${FRANJAS_POR_HORA}` }}
          onClick={() => onSeleccionarHueco(dia, hora)}
        />
      ))}
    </>
  );
}

export default FilaHora;
