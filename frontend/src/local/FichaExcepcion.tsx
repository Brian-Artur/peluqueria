import { useState, type FormEvent, type ReactElement } from "react";
import { esquemaDatosExcepcion, type DatosExcepcion, type Excepcion } from "@peluqueria/compartido";
import { useSesion } from "../sesion/useSesion";
import { mensajeDeError } from "../peticion";
import ListaTramos from "./ListaTramos";
import styles from "./FichaExcepcion.module.css";

type Props = { excepcion: Excepcion | null; onGuardar: (id: number | null, datos: DatosExcepcion) => Promise<void> };

export default function FichaExcepcion({ excepcion, onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  const editable = puede("local:gestionar");
  const [datos, setDatos] = useState<DatosExcepcion>(() => ({
    fecha: excepcion?.fecha ?? "", cerrado: excepcion?.cerrado ?? true,
    motivo: excepcion?.motivo ?? null, tramos: excepcion?.tramos ?? [],
  }));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!editable || guardando) return;
    const resultado = esquemaDatosExcepcion.safeParse(datos);
    if (!resultado.success) { setError(resultado.error.issues[0].message); return; }
    setGuardando(true);
    setError(null);
    try { await onGuardar(excepcion?.id ?? null, resultado.data); }
    catch (fallo) { setError(mensajeDeError(fallo)); }
    finally { setGuardando(false); }
  };
  return <form className={styles.formulario} noValidate onSubmit={guardar}>
    <fieldset className={styles.campos} disabled={guardando || !editable}>
      <label>Fecha (aaaa-mm-dd) <input value={datos.fecha} required placeholder="2026-12-25"
        onChange={(evento) => setDatos({ ...datos, fecha: evento.target.value })} /></label>
      <label>Motivo <input value={datos.motivo ?? ""} maxLength={200}
        onChange={(evento) => setDatos({ ...datos, motivo: evento.target.value })} /></label>
      <label className={styles.casilla}><input type="checkbox" checked={datos.cerrado}
        onChange={(evento) => {
          const cerrado = evento.target.checked;
          setDatos({ ...datos, cerrado, tramos: cerrado ? [] : [{ abre: "09:00", cierra: "14:00" }] });
        }} /> Cerrado todo el día</label>
      {!datos.cerrado && <ListaTramos tramos={datos.tramos} editable={editable} etiqueta="Excepción"
        onCambiar={(tramos) => setDatos({ ...datos, tramos })} />}
      {editable && <button type="submit">{excepcion ? "Guardar excepción" : "Crear excepción"}</button>}
    </fieldset>
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </form>;
}
