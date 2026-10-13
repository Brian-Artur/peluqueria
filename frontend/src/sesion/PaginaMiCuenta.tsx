import { useEffect, useId, useRef, useState, type FormEvent, type ReactElement } from "react";
import { esquemaCambiarMiContrasena } from "@peluqueria/compartido";
import { esAbortada, mensajeDeError, pedir } from "../peticion";
import { comprobarRepeticion } from "../usuarios/comprobarRepeticion";
import { useSesion } from "./useSesion";
import styles from "./PaginaMiCuenta.module.css";

export default function PaginaMiCuenta(): ReactElement {
  const { usuario, puede } = useSesion();
  const prefijo = useId();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const peticion = useRef<AbortController | null>(null);

  useEffect(() => {
    const controlador = new AbortController();
    peticion.current = controlador;
    return () => { controlador.abort(); };
  }, []);

  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (guardando || !puede("sesion:contrasena")) return;
    setError(null);
    setGuardado(false);
    const resultado = esquemaCambiarMiContrasena.safeParse({ actual, nueva });
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message ?? "Revisa las contraseñas");
      return;
    }
    const falloRepeticion = comprobarRepeticion(nueva, repetida);
    if (falloRepeticion !== null) {
      setError(falloRepeticion);
      return;
    }
    setGuardando(true);
    const signal = peticion.current?.signal;
    try {
      await pedir("/api/sesion/contrasena", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resultado.data), signal,
      });
      signal?.throwIfAborted();
      setActual("");
      setNueva("");
      setRepetida("");
      setGuardado(true);
    } catch (fallo) {
      if (!esAbortada(fallo)) setError(mensajeDeError(fallo, "No se pudo cambiar la contraseña"));
    } finally {
      if (!signal?.aborted) setGuardando(false);
    }
  };

  return (
    <section className={styles.pagina}>
      <h1 className={styles.titulo}>Mi cuenta</h1>
      <p>{usuario?.nombre}</p>
      <form className={styles.formulario} noValidate onSubmit={guardar} onChange={() => setGuardado(false)}>
        <h2 className={styles.subtitulo}>Mi contraseña</h2>
        {error !== null && <p role="alert" className={styles.error}>{error}</p>}
        <fieldset className={styles.campos} disabled={guardando || !puede("sesion:contrasena")}>
          <label htmlFor={`${prefijo}-actual`}>Contraseña actual</label>
          <input
            id={`${prefijo}-actual`}
            className={styles.campo}
            type="password"
            value={actual}
            onChange={(evento) => setActual(evento.target.value)}
            autoComplete="current-password"
            maxLength={200}
            required
          />
          <label htmlFor={`${prefijo}-nueva`}>Contraseña nueva</label>
          <input
            id={`${prefijo}-nueva`}
            className={styles.campo}
            type="password"
            value={nueva}
            onChange={(evento) => setNueva(evento.target.value)}
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
          {puede("sesion:contrasena") && <button className={styles.principal} type="submit">{guardando ? "Guardando…" : "Cambiar mi contraseña"}</button>}
        </fieldset>
        {guardado && <p role="status" className={styles.confirmacion}>Contraseña cambiada. Las otras sesiones se han cerrado; esta sigue abierta.</p>}
      </form>
    </section>
  );
}
