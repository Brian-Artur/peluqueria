import type { ReactElement } from "react";
import type { Cita } from "../tipos";
import { horaCorta } from "./fechas";
import { filaDeHora } from "./posicion";
import styles from "./TarjetaCita.module.css";

type Props = {
  cita: Cita;
  columna: number;
  onSeleccionarCita: (id: number) => void;
};

function TarjetaCita({ cita, columna, onSeleccionarCita }: Props): ReactElement {
  const inicio = new Date(cita.inicio);
  const fin = new Date(cita.fin);
  const duracionMinutos = (fin.getTime() - inicio.getTime()) / 60000;
  const hora = horaCorta(inicio);
  const marcaEstado = cita.estado === "completada" ? "✓ " : "";
  const textoCliente = `${marcaEstado}${hora} ${cita.cliente_nombre}`;
  const textoCompleto = `${textoCliente} · ${cita.servicio_nombre} · ${cita.estado}`;

  function contenido(): ReactElement {
    if (duracionMinutos <= 30) {
      return (
        <div className={styles.lineaCorta}>
          {textoCliente} · {cita.servicio_nombre}
        </div>
      );
    }

    return (
      <>
        <div className={styles.citaCliente}>{textoCliente}</div>
        <div className={styles.citaServicio}>{cita.servicio_nombre}</div>
      </>
    );
  }

  return (
    <div
      className={`${styles.cita} ${styles[cita.estado]}`}
      title={textoCompleto}
      style={{
        gridColumn: columna,
        gridRow: `${filaDeHora(inicio)} / ${filaDeHora(fin)}`,
      }}
      onClick={() => onSeleccionarCita(cita.id)}
    >
      {contenido()}
    </div>
  );
}

export default TarjetaCita;
