import type { ReactElement } from "react";
import type { DatosTipoRecurso, TipoRecurso } from "@peluqueria/compartido";
import { useSesion } from "../sesion/useSesion";
import FilaTipo from "./FilaTipo";
import styles from "./GestionTipos.module.css";

type Props = {
  tipos: TipoRecurso[];
  onGuardar: (id: number | null, datos: DatosTipoRecurso) => Promise<void>;
};

function GestionTipos({ tipos, onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  return (
    <section className={styles.bloque} aria-label="Tipos de recurso">
      <h3 className={styles.titulo}>Tipos</h3>
      {puede("local:gestionar") ? <>
        <p className={styles.ayuda}>Para desactivar un tipo, primero da de baja o mueve sus recursos activos.</p>
        {tipos.map((tipo) => <FilaTipo key={`${tipo.id}-${tipo.nombre}-${tipo.activo}`} tipo={tipo} onGuardar={onGuardar} />)}
        <FilaTipo tipo={null} onGuardar={onGuardar} />
      </> : <ul>
        {tipos.map((tipo) => <li key={tipo.id}>{tipo.nombre}{!tipo.activo && " (inactivo)"}</li>)}
      </ul>}
    </section>
  );
}

export default GestionTipos;
