import type { ReactElement } from "react";
import type { Recurso } from "@peluqueria/compartido";
import { agruparRecursos } from "./agruparRecursos";
import styles from "./ListaRecursos.module.css";

type Props = {
  recursos: Recurso[];
  mostrarBajas: boolean;
  seleccion: number | "nuevo" | null;
  onSeleccionar: (id: number) => void;
};

function ListaRecursos({ recursos, mostrarBajas, seleccion, onSeleccionar }: Props): ReactElement {
  const grupos = agruparRecursos(recursos, mostrarBajas);
  return (
    <div className={styles.grupos}>
      {grupos.length === 0 && <p>No hay recursos para mostrar.</p>}
      {grupos.map((grupo) => (
        <section key={grupo.tipoId}>
          <h3 className={styles.tipo}>{grupo.nombre}</h3>
          <ul className={styles.lista}>
            {grupo.recursos.map((recurso) => (
              <li key={recurso.id}>
                <button type="button" aria-pressed={seleccion === recurso.id}
                  className={seleccion === recurso.id ? `${styles.fila} ${styles.abierta}` : styles.fila}
                  onClick={() => onSeleccionar(recurso.id)}>
                  <span className={styles.nombre}>{recurso.nombre}</span>
                  {!recurso.activo && <span className={styles.etiqueta}>Dado de baja</span>}
                  {recurso.fuera_de_servicio && <span className={styles.etiqueta}>Fuera de servicio</span>}
                  {recurso.fuera_de_servicio && <span className={styles.motivo}>{recurso.motivo}</span>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default ListaRecursos;
