import { useState, type FormEvent, type ReactElement } from "react";
import { esquemaHorarioSemanal, type HorarioSemanal } from "@peluqueria/compartido";
import { useSesion } from "../sesion/useSesion";
import { mensajeDeError } from "../peticion";
import EditorSemana from "./EditorSemana";
import styles from "./HorarioGeneral.module.css";

type Props = { general: HorarioSemanal; onGuardar: (semana: HorarioSemanal) => Promise<void> };

export default function HorarioGeneral({ general, onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  const editable = puede("local:gestionar");
  const [semana, setSemana] = useState(general);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!editable || guardando) return;
    const resultado = esquemaHorarioSemanal.safeParse(semana);
    if (!resultado.success) { setError(resultado.error.issues[0].message); return; }
    setGuardando(true);
    setError(null);
    try { await onGuardar(resultado.data); }
    catch (fallo) { setError(mensajeDeError(fallo)); }
    finally { setGuardando(false); }
  };
  return <form className={styles.formulario} noValidate onSubmit={guardar}>
    <h3>Horario general</h3>
    <fieldset className={styles.campos} disabled={guardando}>
      <EditorSemana semana={semana} editable={editable} onCambiar={setSemana} />
      {editable && <button type="submit">Guardar horario</button>}
    </fieldset>
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </form>;
}
