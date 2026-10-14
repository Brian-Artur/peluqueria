import { useId, useState, type FormEvent, type ReactElement } from "react";
import { esquemaDatosRecurso, type DatosRecurso, type Recurso, type TipoRecurso } from "@peluqueria/compartido";
import { mensajeDeError } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import styles from "./FichaRecurso.module.css";

type Props = {
  recurso: Recurso | null;
  tipos: TipoRecurso[];
  onGuardar: (datos: DatosRecurso) => Promise<void>;
};

function FichaRecurso({ recurso, tipos, onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  const puedeGestionar = puede("local:gestionar");
  const prefijo = useId();
  const [nombre, setNombre] = useState(recurso?.nombre ?? "");
  const [tipoId, setTipoId] = useState<number | null>(recurso?.tipo_recurso_id ?? null);
  const [fueraDeServicio, setFueraDeServicio] = useState(recurso?.fuera_de_servicio ?? false);
  const [motivo, setMotivo] = useState(recurso?.motivo ?? "");
  const [activo, setActivo] = useState(recurso?.activo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const tiposActivos = tipos.filter((tipo) => tipo.activo);
  const tipoActual = tipos.find((tipo) => tipo.id === tipoId);

  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (guardando || !puedeGestionar) return;
    setError(null);
    setGuardado(false);
    const resultado = esquemaDatosRecurso.safeParse({
      nombre, tipo_recurso_id: tipoId, fuera_de_servicio: fueraDeServicio, motivo, activo,
    });
    if (!resultado.success) {
      setError(resultado.error.issues.map((problema) => problema.message).join(". "));
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(resultado.data);
      setNombre(resultado.data.nombre);
      setMotivo(resultado.data.motivo ?? "");
      setGuardado(true);
    } catch (fallo) {
      setError(mensajeDeError(fallo, "No se pudo guardar el recurso"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className={styles.ficha} noValidate onSubmit={guardar} onChange={() => setGuardado(false)}>
      <h3 className={styles.titulo}>{recurso === null ? "Nuevo recurso" : "Ficha del recurso"}</h3>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      <fieldset className={styles.campos} disabled={guardando || !puedeGestionar}>
        <label htmlFor={`${prefijo}-nombre`}>Nombre</label>
        <input id={`${prefijo}-nombre`} className={styles.campo} value={nombre} maxLength={60} required
          onChange={(evento) => setNombre(evento.target.value)} />
        <label htmlFor={`${prefijo}-tipo`}>Tipo</label>
        <select id={`${prefijo}-tipo`} className={styles.campo} value={tipoId ?? ""}
          onChange={(evento) => setTipoId(evento.target.value === "" ? null : Number(evento.target.value))}>
          <option value="">Elige un tipo</option>
          {tiposActivos.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}
          {tipoActual && !tipoActual.activo && <option value={tipoActual.id} disabled>{tipoActual.nombre} (inactivo)</option>}
        </select>
        <label className={styles.estado}>
          <input type="checkbox" checked={fueraDeServicio} onChange={(evento) => setFueraDeServicio(evento.target.checked)} />
          Fuera de servicio
        </label>
        <label htmlFor={`${prefijo}-motivo`}>Motivo{fueraDeServicio && " (obligatorio)"}</label>
        <input id={`${prefijo}-motivo`} className={styles.campo} value={motivo} maxLength={200}
          required={fueraDeServicio} onChange={(evento) => setMotivo(evento.target.value)} />
        <label className={styles.estado}>
          <input type="checkbox" checked={activo} onChange={(evento) => setActivo(evento.target.checked)} /> Activo
        </label>
        <p className={styles.ayuda}>Desmarca Activo para dar de baja este recurso.</p>
        {puedeGestionar && <button type="submit" className={styles.principal}>{guardando ? "Guardando…" : "Guardar"}</button>}
      </fieldset>
      {guardado && <p role="status" className={styles.confirmacion}>Recurso guardado.</p>}
    </form>
  );
}

export default FichaRecurso;
