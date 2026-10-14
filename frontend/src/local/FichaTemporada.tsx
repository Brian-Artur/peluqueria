import { useState, type FormEvent, type ReactElement } from "react";
import { esquemaDatosTemporada, esquemaHorarioSemanal, type DatosTemporada, type HorarioSemanal, type Temporada } from "@peluqueria/compartido";
import { useSesion } from "../sesion/useSesion";
import { mensajeDeError } from "../peticion";
import EditorSemana from "./EditorSemana";
import styles from "./FichaTemporada.module.css";

type Props = {
  temporada: Temporada | null;
  onGuardarDatos: (id: number | null, datos: DatosTemporada) => Promise<void>;
  onGuardarHorario: (id: number, semana: HorarioSemanal) => Promise<void>;
};

export default function FichaTemporada({ temporada, onGuardarDatos, onGuardarHorario }: Props): ReactElement {
  const { puede } = useSesion();
  const editable = puede("local:gestionar");
  const [datos, setDatos] = useState<DatosTemporada>(() => ({
    nombre: temporada?.nombre ?? "", desde: temporada?.desde ?? "", hasta: temporada?.hasta ?? "", activa: temporada?.activa ?? false,
  }));
  const [semana, setSemana] = useState<HorarioSemanal>(temporada?.horario ?? []);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const guardarDatos = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!editable || guardando) return;
    const resultado = esquemaDatosTemporada.safeParse(datos);
    if (!resultado.success) { setError(resultado.error.issues[0].message); return; }
    setGuardando(true);
    setError(null);
    try { await onGuardarDatos(temporada?.id ?? null, resultado.data); }
    catch (fallo) { setError(mensajeDeError(fallo)); }
    finally { setGuardando(false); }
  };
  const guardarHorario = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!editable || guardando || !temporada) return;
    const resultado = esquemaHorarioSemanal.safeParse(semana);
    if (!resultado.success) { setError(resultado.error.issues[0].message); return; }
    setGuardando(true);
    setError(null);
    try { await onGuardarHorario(temporada.id, resultado.data); }
    catch (fallo) { setError(mensajeDeError(fallo)); }
    finally { setGuardando(false); }
  };
  return <div className={styles.ficha}>
    <p className={styles.aviso}>Durante la temporada, los días sin tramos están cerrados.</p>
    <form noValidate onSubmit={guardarDatos}>
      <fieldset className={styles.campos} disabled={guardando || !editable}>
        <label>Nombre <input value={datos.nombre} maxLength={60} required
          onChange={(evento) => setDatos({ ...datos, nombre: evento.target.value })} /></label>
        <label>Desde (aaaa-mm-dd) <input value={datos.desde} placeholder="2026-06-01" required
          onChange={(evento) => setDatos({ ...datos, desde: evento.target.value })} /></label>
        <label>Hasta (aaaa-mm-dd) <input value={datos.hasta} placeholder="2026-08-31" required
          onChange={(evento) => setDatos({ ...datos, hasta: evento.target.value })} /></label>
        <label className={styles.casilla}><input type="checkbox" checked={datos.activa}
          onChange={(evento) => setDatos({ ...datos, activa: evento.target.checked })} /> Activa</label>
        {editable && <button type="submit">{temporada ? "Guardar datos de temporada" : "Crear temporada"}</button>}
      </fieldset>
    </form>
    {temporada && <form noValidate onSubmit={guardarHorario}>
      <fieldset className={styles.campos} disabled={guardando}>
        <EditorSemana semana={semana} editable={editable} onCambiar={setSemana} />
        {editable && <button type="submit">Guardar horario de temporada</button>}
      </fieldset>
    </form>}
    {!temporada && <p>Después de crear la temporada, define su semana.</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}
