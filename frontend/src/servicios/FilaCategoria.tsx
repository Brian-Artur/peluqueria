import { useState, type FormEvent, type ReactElement } from "react";
import { esquemaDatosCategoria, type Categoria, type DatosCategoria } from "@peluqueria/compartido";
import { mensajeDeError } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import styles from "./FilaCategoria.module.css";

type Props = {
  categoria: Categoria | null;
  onGuardar: (id: number | null, datos: DatosCategoria) => Promise<void>;
};

function FilaCategoria({ categoria, onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const guardar = async (activa: boolean): Promise<void> => {
    if (guardando || !puede("servicios:gestionar")) return;
    setError(null);
    setGuardado(false);
    const resultado = esquemaDatosCategoria.safeParse({ nombre, activa });
    if (!resultado.success) {
      setError(resultado.error.issues[0].message);
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(categoria?.id ?? null, resultado.data);
      setNombre(categoria === null ? "" : resultado.data.nombre);
      setGuardado(true);
    } catch (fallo) {
      setError(mensajeDeError(fallo, "No se pudo guardar la categoría"));
    } finally {
      setGuardando(false);
    }
  };

  const enviar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    await guardar(categoria?.activa ?? true);
  };

  return (
    <form className={styles.formulario} noValidate onSubmit={enviar}>
      <fieldset className={styles.fila} disabled={guardando || !puede("servicios:gestionar")}>
        <label className={styles.nombre}>
          {categoria === null ? "Nueva categoría" : `Nombre de ${categoria.nombre}`}
          <input value={nombre} maxLength={60} required onChange={(evento) => {
            setNombre(evento.target.value);
            setGuardado(false);
          }} />
        </label>
        {categoria !== null && <span className={styles.estado}>{categoria.activa ? "Activa" : "Inactiva"}</span>}
        <button type="submit">{categoria === null ? "Crear categoría" : "Renombrar"}</button>
        {categoria !== null && <button type="button" onClick={() => guardar(!categoria.activa)}>
          {categoria.activa ? "Desactivar" : "Activar"}
        </button>}
      </fieldset>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      {guardado && <p role="status" className={styles.confirmacion}>Categoría guardada.</p>}
    </form>
  );
}

export default FilaCategoria;
