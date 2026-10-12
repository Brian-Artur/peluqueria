import type { Cita } from "../tipos";
import { columnaDeDia, filaDeHora } from "./posicion";
import styles from "./TarjetaCita.module.css";

type Props = {
  cita: Cita;
  onSeleccionarCita: (id: number) => void;
};

function TarjetaCita({ cita, onSeleccionarCita }: Props) {
  const inicio = new Date(cita.inicio);
  const fin = new Date(cita.fin);

  return (
    <div
      className={`${styles.cita} ${styles[cita.estado]}`}
      style={{
        gridColumn: columnaDeDia(inicio),
        gridRow: `${filaDeHora(inicio)} / ${filaDeHora(fin)}`,
      }}
      onClick={() => onSeleccionarCita(cita.id)}
    >
      <div className={styles.citaCliente}>{cita.cliente_nombre}</div>
      <div className={styles.citaServicio}>{cita.servicio_nombre}</div>
    </div>
  );
}

export default TarjetaCita;