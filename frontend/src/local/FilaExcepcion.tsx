import { useState, type ReactElement } from "react";
import type { DatosExcepcion, Excepcion } from "@peluqueria/compartido";
import { useSesion } from "../sesion/useSesion";
import { mensajeDeError } from "../peticion";
import { formatearFecha } from "../empleados/formatearFecha";
import FichaExcepcion from "./FichaExcepcion";
import styles from "./FilaExcepcion.module.css";

type Props = {
  excepcion: Excepcion;
  revision: number;
  onGuardar: (id: number | null, datos: DatosExcepcion) => Promise<void>;
  onEliminar: (id: number) => Promise<void>;
};

export default function FilaExcepcion({ excepcion, revision, onGuardar, onEliminar }: Props): ReactElement {
  const { puede } = useSesion();
  const [abierta, setAbierta] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eliminar = async (): Promise<void> => {
    if (!puede("local:gestionar") || eliminando) return;
    setEliminando(true);
    setError(null);
    try { await onEliminar(excepcion.id); }
    catch (fallo) { setError(mensajeDeError(fallo)); }
    finally { setEliminando(false); }
  };
  return <li className={styles.fila}>
    <div className={styles.resumen}>
      <button type="button" aria-expanded={abierta} onClick={() => setAbierta(!abierta)}>
        {formatearFecha(excepcion.fecha)} · {excepcion.cerrado ? "Cerrado" : "Horario especial"}
        {excepcion.motivo && ` · ${excepcion.motivo}`}
        <span className={styles.accion}>{puede("local:gestionar") ? "Editar" : "Ver"}</span>
      </button>
      {puede("local:gestionar") && !confirmando && <button type="button" onClick={() => setConfirmando(true)}>Quitar</button>}
    </div>
    {confirmando && puede("local:gestionar") && <div className={styles.confirmacion}>
      <span>¿Quitar la excepción del {formatearFecha(excepcion.fecha)}?</span>
      <button type="button" disabled={eliminando} onClick={eliminar}>Sí, quitar</button>
      <button type="button" disabled={eliminando} onClick={() => setConfirmando(false)}>Conservar</button>
    </div>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
    {abierta && <FichaExcepcion key={`${excepcion.id}-${revision}`} excepcion={excepcion} onGuardar={onGuardar} />}
  </li>;
}
