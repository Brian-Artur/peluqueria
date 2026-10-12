import type { ReactElement } from "react";
import styles from "./ControlesSemana.module.css";

type Props = {
  lunesVisible: Date;
  onAnterior: () => void;
  onSiguiente: () => void;
};

function ControlesSemana({ lunesVisible, onAnterior, onSiguiente }: Props): ReactElement {
  return (
    <div className={styles.controles}>
      <button className={styles.secundario} onClick={onAnterior}>← Anterior</button>
      <span>{lunesVisible.toLocaleDateString("es-ES")}</span>
      <button className={styles.secundario} onClick={onSiguiente}>Siguiente →</button>
    </div>
  );
}

export default ControlesSemana;
