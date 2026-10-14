import { useState, type FormEvent, type ReactElement } from "react";
import { esquemaLocal, type Local } from "@peluqueria/compartido";
import { useSesion } from "../sesion/useSesion";
import { mensajeDeError } from "../peticion";
import styles from "./DatosSalon.module.css";

type Props = { local: Local; onGuardar: (local: Local) => Promise<void> };
const zonas = Intl.supportedValuesOf("timeZone");

export default function DatosSalon({ local, onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  const editable = puede("local:gestionar");
  const [datos, setDatos] = useState(local);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const opcionesZona = zonas.includes(datos.zona_horaria) ? zonas : [datos.zona_horaria, ...zonas];
  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!editable || guardando) return;
    const resultado = esquemaLocal.safeParse(datos);
    if (!resultado.success) { setError(resultado.error.issues[0].message); return; }
    setGuardando(true);
    setError(null);
    try { await onGuardar(resultado.data); }
    catch (fallo) { setError(mensajeDeError(fallo)); }
    finally { setGuardando(false); }
  };
  return <form className={styles.formulario} noValidate onSubmit={guardar}>
    <h3>Datos del salón</h3>
    <fieldset className={styles.campos} disabled={guardando || !editable}>
      <label>Nombre <input value={datos.nombre} maxLength={120} required
        onChange={(evento) => setDatos({ ...datos, nombre: evento.target.value })} /></label>
      <label>Zona horaria <select value={datos.zona_horaria}
        onChange={(evento) => setDatos({ ...datos, zona_horaria: evento.target.value })}>
        {opcionesZona.map((zona) => <option key={zona} value={zona}>{zona}</option>)}
      </select></label>
      {editable && <button type="submit">Guardar datos del salón</button>}
    </fieldset>
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </form>;
}
