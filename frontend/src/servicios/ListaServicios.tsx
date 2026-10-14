import type { ReactElement } from "react";
import { Link } from "react-router";
import type { Servicio } from "@peluqueria/compartido";
import { agruparServicios } from "../catalogo/agruparServicios";
import { formatearPrecio } from "./formatearPrecio";
import { textosDificultad } from "./textosDificultad";
import styles from "./ListaServicios.module.css";

type Props = { servicios: Servicio[]; servicioId: number | null };

function ListaServicios({ servicios, servicioId }: Props): ReactElement {
  return (
    <div className={styles.grupos}>
      {agruparServicios(servicios).map((grupo) => (
        <section key={grupo.categoriaId ?? "sin-categoria"}>
          <h2 className={styles.categoria}>{grupo.nombre}</h2>
          <ul className={styles.lista}>
            {grupo.servicios.map((servicio) => (
              <li key={servicio.id} className={servicio.activo ? undefined : styles.inactivo}>
                <Link
                  to={`/servicios/${servicio.id}`}
                  className={servicio.id === servicioId ? `${styles.fila} ${styles.abierta}` : styles.fila}
                  aria-current={servicio.id === servicioId ? "page" : undefined}
                >
                  <span className={styles.nombre}>{servicio.nombre}</span>
                  <span className={styles.dificultad}>Dificultad {textosDificultad[servicio.dificultad]}</span>
                  <span>{servicio.duracion_min} min{servicio.margen_min > 0 && ` + ${servicio.margen_min}`}</span>
                  <span>{formatearPrecio(servicio.precio)}</span>
                  {!servicio.activo && <span className={styles.etiqueta}>Inactivo</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default ListaServicios;
