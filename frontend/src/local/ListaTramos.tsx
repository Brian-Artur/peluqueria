import type { ReactElement } from "react";
import type { Tramo } from "@peluqueria/compartido";
import { añadirTramo, horasDeCincoMinutos } from "./semanaHorario";
import styles from "./ListaTramos.module.css";

type Props = { tramos: Tramo[]; editable: boolean; etiqueta: string; onCambiar: (tramos: Tramo[]) => void };
const horas = horasDeCincoMinutos();

export default function ListaTramos({ tramos, editable, etiqueta, onCambiar }: Props): ReactElement {
  const cambiar = (indice: number, campo: keyof Tramo, valor: string): void => {
    onCambiar(tramos.map((tramo, posicion) => {
      if (posicion !== indice) return tramo;
      return { ...tramo, [campo]: valor };
    }));
  };
  return <div className={styles.lista}>
    {tramos.length === 0 && <span className={styles.cerrado}>Cerrado</span>}
    {tramos.map((tramo, indice) => <div key={indice} className={styles.tramo}>
      {editable ? <>
        <label>Abre <select aria-label={`${etiqueta}: apertura del tramo ${indice + 1}`} value={tramo.abre}
          onChange={(evento) => cambiar(indice, "abre", evento.target.value)}>
          {horas.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
        </select></label>
        <label>Cierra <select aria-label={`${etiqueta}: cierre del tramo ${indice + 1}`} value={tramo.cierra}
          onChange={(evento) => cambiar(indice, "cierra", evento.target.value)}>
          {horas.map((hora) => <option key={hora} value={hora}>{hora}</option>)}
        </select></label>
        <button type="button" aria-label={`${etiqueta}: quitar tramo ${indice + 1}`}
          onClick={() => onCambiar(tramos.filter((_, posicion) => posicion !== indice))}>Quitar</button>
      </> : <span>{tramo.abre}–{tramo.cierra}</span>}
    </div>)}
    {editable && <button type="button" className={styles.añadir} disabled={tramos.at(-1)?.cierra === "23:55"}
      onClick={() => onCambiar(añadirTramo(tramos))}>Añadir tramo</button>}
  </div>;
}
