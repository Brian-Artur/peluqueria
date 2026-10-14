import { useState, type FormEvent, type ReactElement } from "react";
import { esquemaDatosTipoRecurso, type TipoRecurso, type DatosTipoRecurso } from "@peluqueria/compartido";
import { mensajeDeError } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import styles from "./FilaTipo.module.css";

type Props = {
  tipo: TipoRecurso | null;
  onGuardar: (id: number | null, datos: DatosTipoRecurso) => Promise<void>;
};

function FilaTipo({ tipo, onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  const [nombre, setNombre] = useState(tipo?.nombre ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const guardar = async (activo: boolean): Promise<void> => {
    if (guardando || !puede("local:gestionar")) return;
    setError(null);
    setGuardado(false);
    const resultado = esquemaDatosTipoRecurso.safeParse({ nombre, activo });
    if (!resultado.success) {
      setError(resultado.error.issues[0].message);
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(tipo?.id ?? null, resultado.data);
      setNombre(tipo === null ? "" : resultado.data.nombre);
      setGuardado(true);
    } catch (fallo) {
      setError(mensajeDeError(fallo, "No se pudo guardar el tipo de recurso"));
    } finally {
      setGuardando(false);
    }
  };

  const enviar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    await guardar(tipo?.activo ?? true);
  };

  return (
    <form className={styles.formulario} noValidate onSubmit={enviar}>
      <fieldset className={styles.fila} disabled={guardando || !puede("local:gestionar")}>
        <label className={styles.nombre}>
          {tipo === null ? "Nuevo tipo de recurso" : `Nombre de ${tipo.nombre}`}
          <input value={nombre} maxLength={60} required onChange={(evento) => {
            setNombre(evento.target.value);
            setGuardado(false);
          }} />
        </label>
        {tipo !== null && <span className={styles.estado}>{tipo.activo ? "Activo" : "Inactivo"}</span>}
        <button type="submit">{tipo === null ? "Crear tipo de recurso" : "Renombrar"}</button>
        {tipo !== null && <button type="button" onClick={() => guardar(!tipo.activo)}>
          {tipo.activo ? "Desactivar" : "Activar"}
        </button>}
      </fieldset>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      {guardado && <p role="status" className={styles.confirmacion}>Tipo de recurso guardado.</p>}
    </form>
  );
}

export default FilaTipo;
