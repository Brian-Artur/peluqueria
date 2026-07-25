import type { Cita } from "../tipos";
import { columnaDeDia, filaDeHora } from "./posicion";

type Props = {
  cita: Cita;
  onSeleccionarCita: (id: number) => void;
};

function TarjetaCita({ cita, onSeleccionarCita }: Props) {
  const inicio = new Date(cita.inicio);
  const fin = new Date(cita.fin);

  return (
    <div
      className={`cita ${cita.estado}`}
      style={{
        gridColumn: columnaDeDia(inicio),
        gridRow: `${filaDeHora(inicio)} / ${filaDeHora(fin)}`,
      }}
      onClick={() => onSeleccionarCita(cita.id)}
    >
      <div className="cita-cliente">{cita.cliente_nombre}</div>
      <div className="cita-servicio">{cita.servicio_nombre}</div>
    </div>
  );
}

export default TarjetaCita;