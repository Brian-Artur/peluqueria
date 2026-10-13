import { useState, type FormEvent, type ReactElement } from "react";
import { Navigate, useLocation } from "react-router";
import { mensajeDeError } from "../peticion";
import { useSesion } from "./useSesion";
import { rutaTrasEntrar } from "./rutaTrasEntrar";
import styles from "./PaginaEntrar.module.css";

export default function PaginaEntrar(): ReactElement {
  const { usuario, entrar } = useSesion();
  const ubicacion = useLocation();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [entradaSolicitada, setEntradaSolicitada] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enviar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (entrando) return;
    setEntrando(true);
    setEntradaSolicitada(true);
    setError(null);
    try {
      await entrar({ nombre_usuario: nombreUsuario, contrasena });
    } catch (fallo) {
      setEntradaSolicitada(false);
      setError(mensajeDeError(fallo));
    } finally {
      setEntrando(false);
    }
  };

  if (usuario !== null) {
    const destino = entradaSolicitada ? rutaTrasEntrar(ubicacion.state) : "/agenda";
    return <Navigate to={destino} replace />;
  }

  return (
    <main className={styles.pagina}>
      <form className={styles.formulario} onSubmit={enviar}>
        <h1 className={styles.titulo}>Entrar en Peluquería</h1>
        {error !== null && <p role="alert" className={styles.error}>{error}</p>}
        <fieldset className={styles.campos} disabled={entrando}>
          <label htmlFor="nombre-usuario">Usuario</label>
          <input id="nombre-usuario" name="nombre_usuario" className={styles.campo}
            autoComplete="username" required maxLength={50} value={nombreUsuario}
            onChange={(evento) => setNombreUsuario(evento.target.value)} />
          <label htmlFor="contrasena">Contraseña</label>
          <input id="contrasena" name="contrasena" className={styles.campo} type="password"
            autoComplete="current-password" required value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)} />
          <button className={styles.principal} type="submit">{entrando ? "Entrando…" : "Entrar"}</button>
        </fieldset>
      </form>
    </main>
  );
}
