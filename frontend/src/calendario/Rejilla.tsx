import type { ReactElement } from "react";
import { HORAS } from "./constantes";
import FilaHora from "./FilaHora";

type Props = {
  dias: Date[];
  huecoSeleccionado: Date | null;
  onSeleccionarHueco: (dia: Date, hora: number) => void;
};

function Rejilla({ dias, huecoSeleccionado, onSeleccionarHueco }: Props): ReactElement {
  return (
    <>
      {HORAS.map((hora) => (
        <FilaHora
          key={hora}
          hora={hora}
          dias={dias}
          huecoSeleccionado={huecoSeleccionado}
          onSeleccionarHueco={onSeleccionarHueco}
        />
      ))}
    </>
  );
}

export default Rejilla;
