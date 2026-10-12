import { DIAS } from "./constantes";
import styles from "./CabeceraDias.module.css";

function CabeceraDias() {
  return (
    <>
      <div className={styles.esquina} />
      {DIAS.map((dia, i) => (
        <div key={dia} className={styles.cabeceraDia} style={{ gridColumn: i + 2 }}>
          {dia}
        </div>
      ))}
    </>
  );
}

export default CabeceraDias;