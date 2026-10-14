import type { ReactElement } from "react";
import { FRANJAS_POR_HORA } from "./constantes";
import type { DiaResuelto } from "@peluqueria/compartido";
import { fechaDeDia } from "./horario";
import CeldaHora from "./CeldaHora";
import styles from "./FilaHora.module.css";

type Props = {
  hora: number;
  horaInicio: number;
  horario: DiaResuelto[];
  dias: Date[];
  huecoSeleccionado: Date | null;
  onSeleccionarHueco: (dia: Date, hora: number, minuto: number) => void;
};

function FilaHora({ hora, horaInicio, horario, dias, huecoSeleccionado, onSeleccionarHueco }: Props): ReactElement {
  const filaInicio = (hora - horaInicio) * FRANJAS_POR_HORA + 2;

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
          tramos={horario.find((resuelto) => resuelto.fecha === fechaDeDia(dia))?.tramos ?? []}
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
