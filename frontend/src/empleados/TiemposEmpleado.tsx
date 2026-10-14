import type { ReactElement } from "react";
import type { CambioTiempo, DatosTiempo, TiempoEmpleado } from "@peluqueria/compartido";
import { useSesion } from "../sesion/useSesion";
import FilaTiempoEmpleado from "./FilaTiempoEmpleado";
import { textoCambioTiempo } from "./textoCambioTiempo";
import styles from "./TiemposEmpleado.module.css";

type Props = {
  tiempos: TiempoEmpleado[];
  historial: CambioTiempo[];
  revision: number;
  ocupado: boolean;
  onGuardar: (servicioId: number, datos: DatosTiempo) => Promise<void>;
};

export default function TiemposEmpleado({ tiempos, historial, revision, ocupado, onGuardar }: Props): ReactElement | null {
  const { puede } = useSesion();
  if (!puede("rendimiento:ver")) return null;
  return <section className={styles.seccion} aria-label="Tiempos del empleado">
    <h2 className={styles.titulo}>Tiempos</h2>
    <p className={styles.ayuda}>Total = duración (propia o del servicio) + margen del servicio + margen del empleado</p>
    {tiempos.length === 0 ? <p className={styles.ayuda}>No hay competencias con tiempos.</p> :
      <div className={styles.desplazamiento} tabIndex={0} role="region" aria-label="Tabla de tiempos por competencia">
        <table className={styles.tabla}>
          <caption>Tiempos por competencia (minutos)</caption>
          <thead><tr>
            <th scope="col">Servicio</th><th scope="col">Nivel</th>
            <th scope="col">Duración del servicio</th><th scope="col">Duración propia</th>
            <th scope="col">Margen del servicio</th><th scope="col">Margen propio</th>
            <th scope="col">Total agendado</th>
            {puede("rendimiento:gestionar") && <th scope="col">Acciones</th>}
          </tr></thead>
          <tbody>{tiempos.map((tiempo) => <FilaTiempoEmpleado key={`${tiempo.servicio_id}-${revision}`}
            tiempo={tiempo} ocupado={ocupado} onGuardar={onGuardar} />)}</tbody>
        </table>
      </div>}
    <details className={styles.historial}>
      <summary>Historial de cambios</summary>
      {historial.length === 0 ? <p className={styles.ayuda}>Todavía no hay cambios de tiempos.</p> :
        <ul>{historial.map((cambio, indice) => <li key={indice}>{textoCambioTiempo(cambio)}</li>)}</ul>}
    </details>
  </section>;
}
