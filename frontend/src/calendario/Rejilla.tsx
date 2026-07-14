import { HORAS } from "./constantes";
import FilaHora from "./FilaHora";

type Props = {
  onSeleccionarHueco: (d: number, hora: number) => void;
};

function Rejilla({ onSeleccionarHueco }: Props) {
  return (
    <>
      {HORAS.map((hora) => (
        <FilaHora key={hora} hora={hora} onSeleccionarHueco={onSeleccionarHueco} />
      ))}
    </>
  );
}

export default Rejilla;