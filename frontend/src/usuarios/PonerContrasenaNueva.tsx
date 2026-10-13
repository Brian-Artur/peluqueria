import { useId, useState, type FormEvent, type ReactElement } from "react";
import { esquemaContrasenaNueva } from "@peluqueria/compartido";
import { esAbortada, mensajeDeError } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import { comprobarRepeticion } from "./comprobarRepeticion";
import styles from "./PonerContrasenaNueva.module.css";

type Props = { onGuardar: (contrasena: string) => Promise<void> };

export default function PonerContrasenaNueva({ onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  const prefijo = useId();
  const [contrasena, setContrasena] = useState("");
  const [repetida, setRepetida] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (guardando || !puede("usuarios:gestionar")) return;
    setGuardado(false);
    setError(null);
    const resultado = esquemaContrasenaNueva.safeParse({ contrasena });
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message ?? "Revisa la contraseña");
      return;
    }
    const falloRepeticion = comprobarRepeticion(contrasena, repetida);
    if (falloRepeticion !== null) {
      setError(falloRepeticion);
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(resultado.data.contrasena);
      setContrasena("");
      setRepetida("");
      setGuardado(true);
    } catch (fallo) {
      if (!esAbortada(fallo)) setError(mensajeDeError(fallo, "No se pudo cambiar la contraseña"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className={styles.seccion} noValidate onSubmit={guardar} onChange={() => setGuardado(false)}>
      <h3 className={styles.titulo}>Poner contraseña nueva</h3>
      <p className={styles.ayuda}>Se cerrarán todas las sesiones de este usuario.</p>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      <fieldset className={styles.campos} disabled={guardando || !puede("usuarios:gestionar")}>
        <label htmlFor={`${prefijo}-clave`}>Contraseña nueva</label>
        <input
          id={`${prefijo}-clave`}
          className={styles.campo}
          type="password"
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
          autoComplete="new-password"
          minLength={8}
          maxLength={200}
          required
        />
        <label htmlFor={`${prefijo}-repetida`}>Repetir contraseña</label>
        <input
          id={`${prefijo}-repetida`}
          className={styles.campo}
          type="password"
          value={repetida}
          onChange={(evento) => setRepetida(evento.target.value)}
          autoComplete="new-password"
          maxLength={200}
          required
        />
        {puede("usuarios:gestionar") && <button className={styles.principal} type="submit">{guardando ? "Guardando…" : "Poner contraseña nueva"}</button>}
      </fieldset>
      {guardado && <p role="status" className={styles.confirmacion}>Contraseña cambiada. Se han cerrado sus sesiones.</p>}
    </form>
  );
}
