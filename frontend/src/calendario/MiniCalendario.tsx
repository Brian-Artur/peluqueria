import { useState, type ReactElement } from "react";
import { DIAS_APERTURA } from "./constantes";
import { diasDelMes, mismoDia } from "./fechas";
import styles from "./MiniCalendario.module.css";

type Props = {
  valor: Date;
  onCambiar: (fecha: Date) => void;
};

const INICIALES_DIA = ["L", "M", "X", "J", "V", "S", "D"];

function MiniCalendario({ valor, onCambiar }: Props): ReactElement {
  const [mesVisible, setMesVisible] = useState(
    () => new Date(valor.getFullYear(), valor.getMonth(), 1)
  );
  const dias = diasDelMes(mesVisible);
  const hoy = new Date();
  const nombreMes = mesVisible.toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric"
  });

  function cambiarMes(desplazamiento: number): void {
    setMesVisible(new Date(
      mesVisible.getFullYear(),
      mesVisible.getMonth() + desplazamiento,
      1
    ));
  }

  function elegirDia(dia: Date): void {
    const nuevaFecha = new Date(dia);
    nuevaFecha.setHours(valor.getHours(), valor.getMinutes(), 0, 0);
    onCambiar(nuevaFecha);
  }

  return (
    <div className={styles.calendario}>
      <div className={styles.cabecera}>
        <button
          type="button"
          className={styles.flecha}
          aria-label="Mes anterior"
          onClick={() => cambiarMes(-1)}
        >
          ‹
        </button>
        <span aria-live="polite">{nombreMes}</span>
        <button
          type="button"
          className={styles.flecha}
          aria-label="Mes siguiente"
          onClick={() => cambiarMes(1)}
        >
          ›
        </button>
      </div>

      <div className={styles.rejilla}>
        {INICIALES_DIA.map((inicial) => (
          <span key={inicial} className={styles.inicial} aria-hidden="true">
            {inicial}
          </span>
        ))}
        {dias.map((dia, indice) => {
          if (dia === null) return <span key={`hueco-${indice}`} aria-hidden="true" />;

          const elegido = mismoDia(dia, valor);
          const esHoy = mismoDia(dia, hoy);
          const cerrado = !DIAS_APERTURA.includes(dia.getDay());
          const clases = [styles.dia];
          if (cerrado) clases.push(styles.cerrado);
          if (esHoy) clases.push(styles.hoy);
          if (elegido) clases.push(styles.elegido);

          return (
            <button
              key={dia.getTime()}
              type="button"
              className={clases.join(" ")}
              aria-label={dia.toLocaleDateString("es-ES", { dateStyle: "full" })}
              aria-pressed={elegido}
              aria-current={esHoy ? "date" : undefined}
              onClick={() => elegirDia(dia)}
            >
              {dia.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MiniCalendario;
