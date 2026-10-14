import type { ReactElement } from "react";
import { Link } from "react-router";
import type { EmpleadoResumen } from "@peluqueria/compartido";
import { textoNumeroCompetencias, textosContrato } from "./textos";
import styles from "./ListaEmpleados.module.css";

type Props = { empleados: EmpleadoResumen[]; empleadoId: number | null };

export default function ListaEmpleados({ empleados, empleadoId }: Props): ReactElement {
  return (
    <ul className={styles.lista}>
      {empleados.map((empleado) => <li key={empleado.id} className={empleado.activo ? undefined : styles.inactivo}>
        <Link to={`/empleados/${empleado.id}`} aria-current={empleadoId === empleado.id ? "page" : undefined}
          className={empleadoId === empleado.id ? `${styles.fila} ${styles.abierta}` : styles.fila}>
          <span className={styles.nombre}>{empleado.nombre}</span>
          <span>{empleado.contrato_vigente === null ? "Sin contrato vigente" : textosContrato[empleado.contrato_vigente]}</span>
          <span>{textoNumeroCompetencias(empleado.num_competencias)}</span>
          {!empleado.activo && <span className={styles.etiqueta}>De baja</span>}
        </Link>
      </li>)}
    </ul>
  );
}
