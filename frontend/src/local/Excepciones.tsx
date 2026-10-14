import { useState, type ReactElement } from "react";
import type { DatosExcepcion, Excepcion } from "@peluqueria/compartido";
import { useSesion } from "../sesion/useSesion";
import { fechaDeDia } from "../calendario/horario";
import { separarExcepciones } from "./ordenarExcepciones";
import FichaExcepcion from "./FichaExcepcion";
import FilaExcepcion from "./FilaExcepcion";
import styles from "./Excepciones.module.css";

type Props = {
  excepciones: Excepcion[]; revision: number;
  onGuardar: (id: number | null, datos: DatosExcepcion) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
};

export default function Excepciones({ excepciones, revision, onGuardar, onEliminar }: Props): ReactElement {
  const { puede } = useSesion();
  const [nueva, setNueva] = useState(false);
  const { proximas, pasadas } = separarExcepciones(excepciones, fechaDeDia(new Date()));
  const crear = async (id: number | null, datos: DatosExcepcion): Promise<void> => {
    await onGuardar(id, datos);
    setNueva(false);
  };
  return <section className={styles.seccion}>
    <h3>Excepciones</h3>
    {puede("local:gestionar") && <button type="button" onClick={() => setNueva(!nueva)}>
      {nueva ? "Cancelar nueva excepción" : "Nueva excepción"}
    </button>}
    {nueva && puede("local:gestionar") && <FichaExcepcion excepcion={null} onGuardar={crear} />}
    <ul className={styles.lista}>{proximas.map((excepcion) => <FilaExcepcion key={excepcion.id}
      excepcion={excepcion} revision={revision} onGuardar={onGuardar} onEliminar={onEliminar} />)}</ul>
    {proximas.length === 0 && <p>No hay excepciones próximas.</p>}
    {pasadas.length > 0 && <details>
      <summary>Excepciones pasadas ({pasadas.length})</summary>
      <ul className={styles.lista}>{pasadas.map((excepcion) => <FilaExcepcion key={excepcion.id}
        excepcion={excepcion} revision={revision} onGuardar={onGuardar} onEliminar={onEliminar} />)}</ul>
    </details>}
  </section>;
}
