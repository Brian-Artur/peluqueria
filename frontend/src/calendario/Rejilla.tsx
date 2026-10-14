import type { ReactElement } from "react";
import type { DiaResuelto } from "@peluqueria/compartido";
import type { RangoRejilla } from "./horario";
import FilaHora from "./FilaHora";

type Props = {
  dias: Date[];
  horario: DiaResuelto[];
  rango: RangoRejilla;
  huecoSeleccionado: Date | null;
  onSeleccionarHueco: (dia: Date, hora: number, minuto: number) => void;
};

function Rejilla({ dias, horario, rango, huecoSeleccionado, onSeleccionarHueco }: Props): ReactElement {
  const horas = Array.from({ length: rango.horaFin - rango.horaInicio }, (_, indice) => rango.horaInicio + indice);
  return (
    <>
      {horas.map((hora) => (
        <FilaHora
          key={hora}
          hora={hora}
          horaInicio={rango.horaInicio}
          horario={horario}
          dias={dias}
          huecoSeleccionado={huecoSeleccionado}
          onSeleccionarHueco={onSeleccionarHueco}
        />
      ))}
    </>
  );
}

export default Rejilla;
