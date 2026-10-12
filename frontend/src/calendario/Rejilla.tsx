import type { ReactElement } from "react";
import { HORAS } from "./constantes";
import FilaHora from "./FilaHora";

type Props = {
  dias: Date[];
  onSeleccionarHueco: (dia: Date, hora: number) => void;
};

function Rejilla({ dias, onSeleccionarHueco }: Props): ReactElement {
  return (
    <>
      {HORAS.map((hora) => (
        <FilaHora key={hora} hora={hora} dias={dias} onSeleccionarHueco={onSeleccionarHueco} />
      ))}
    </>
  );
}

export default Rejilla;
