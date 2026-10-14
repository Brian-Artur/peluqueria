import type { ReactElement } from "react";
import type { HorarioSemanal } from "@peluqueria/compartido";
import { cambiarTramosDeDia, DIAS_SEMANA } from "./semanaHorario";
import ListaTramos from "./ListaTramos";
import styles from "./EditorSemana.module.css";

type Props = { semana: HorarioSemanal; editable: boolean; onCambiar: (semana: HorarioSemanal) => void };

export default function EditorSemana({ semana, editable, onCambiar }: Props): ReactElement {
  return <div className={styles.semana}>
    {DIAS_SEMANA.map((dia) => <div key={dia.numero} className={styles.dia}>
      <strong>{dia.nombre}</strong>
      <ListaTramos tramos={semana.find((elemento) => elemento.dia_semana === dia.numero)?.tramos ?? []}
        editable={editable} etiqueta={dia.nombre}
        onCambiar={(tramos) => onCambiar(cambiarTramosDeDia(semana, dia.numero, tramos))} />
    </div>)}
  </div>;
}
