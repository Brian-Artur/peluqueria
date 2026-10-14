import type { ReactElement } from "react";
import type { Cita } from "../tipos";
import { horaCorta } from "./fechas";
import { filasDeCita } from "./posicion";
import styles from "./TarjetaCita.module.css";

type Props = {
  cita: Cita;
  columna: number;
  horaInicio: number;
  franjas: number;
  seleccionada: boolean;
  onSeleccionarCita: (id: number) => void;
};

function TarjetaCita({ cita, columna, horaInicio, franjas, seleccionada, onSeleccionarCita }: Props): ReactElement | null {
  const inicio = new Date(cita.inicio);
  const fin = new Date(cita.fin);
  const horario = `${horaCorta(inicio)}–${horaCorta(fin)}`;
  const marcaEstado = cita.estado === "completada" ? "✓ " : "";
  const textoCliente = `${marcaEstado}${cita.cliente_nombre}`;
  const textoServicio = `${cita.servicio_nombre} · ${horario}`;
  const textoCompleto = `${textoCliente} · ${textoServicio} · ${cita.estado}`;

  // Las citas enteramente fuera del rango se muestran en la lista bajo la rejilla.
  const filas = filasDeCita(inicio, fin, horaInicio, franjas);
  if (filas === null) return null;

  return (
    <div
      className={`${styles.cita} ${styles[cita.estado]} ${seleccionada ? styles.seleccionada : ""}`}
      title={textoCompleto}
      style={{
        gridColumn: columna,
        gridRow: `${filas.inicio} / ${filas.fin}`,
      }}
      onClick={() => onSeleccionarCita(cita.id)}
    >
      <div className={styles.citaCliente}>{textoCliente}</div>
      <div className={styles.citaServicio}>{textoServicio}</div>
    </div>
  );
}

export default TarjetaCita;
