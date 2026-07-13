import { HORAS } from "./constantes";
import FilaHora from "./FilaHora";

function Rejilla() {
  return (
    <>
      {HORAS.map((hora) => (
        <FilaHora key={hora} hora={hora} />
      ))}
    </>
  );
}

export default Rejilla;