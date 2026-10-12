import { DIAS, FRANJAS_POR_HORA, HORA_APERTURA } from "./constantes";
import styles from "./FilaHora.module.css";

type Props = {
  hora: number;
  onSeleccionarHueco: (d: number, hora: number) => void;
};

function FilaHora({ hora, onSeleccionarHueco }: Props) {
  const filaInicio = (hora - HORA_APERTURA) * FRANJAS_POR_HORA + 2;

  return (
    <>
      <div
        className={styles.etiquetaHora}
        style={{ gridRow: `${filaInicio} / span ${FRANJAS_POR_HORA}` }}
      >
        {hora}:00
      </div>

      {DIAS.map((dia, d) => (
        <div
          key={dia}
          className={styles.celda}
          style={{ gridColumn: d + 2, gridRow: `${filaInicio} / span ${FRANJAS_POR_HORA}` }}
          onClick={() => onSeleccionarHueco(d, hora)}
        />
      ))}
    </>
  );
}

export default FilaHora;