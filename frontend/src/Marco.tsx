import { useState, type ReactElement } from "react";
import { NavLink, Outlet } from "react-router";
import { mensajeDeError } from "./peticion";
import { useSesion } from "./sesion/useSesion";
import { textoRol } from "./usuarios/textoRol";
import styles from "./Marco.module.css";

function Marco(): ReactElement {
  const { usuario, salir, puede } = useSesion();
  const [saliendo, setSaliendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cerrarSesion = async (): Promise<void> => {
    if (saliendo) return;
    setSaliendo(true);
    setError(null);
    try {
      await salir();
    } catch (fallo) {
      setError(mensajeDeError(fallo, "No se pudo cerrar la sesión"));
    } finally {
      setSaliendo(false);
    }
  };

  return (
    <div className={styles.pagina}>
      <header className={styles.barra}>
        <span className={styles.nombre}>Peluquería</span>
        <nav className={styles.navegacion} aria-label="Navegación principal">
          {puede("citas:ver") && <NavLink to="/agenda" className={styles.enlace}>Agenda</NavLink>}
          {puede("clientes:ver") && <NavLink to="/clientes" className={styles.enlace}>Clientes</NavLink>}
          {puede("citas:ver") && <NavLink to="/servicios" className={styles.enlace}>Servicios</NavLink>}
          {puede("usuarios:gestionar") && <NavLink to="/usuarios" className={styles.enlace}>Usuarios</NavLink>}
        </nav>
        {usuario !== null && (
          <div className={styles.sesion}>
            <NavLink to="/mi-cuenta" className={styles.enlace}>{usuario.nombre}</NavLink>
            <span className={styles.rol}>{textoRol(usuario.rol)}</span>
            <button type="button" className={styles.secundario} disabled={saliendo} onClick={cerrarSesion}>
              {saliendo ? "Saliendo…" : "Salir"}
            </button>
          </div>
        )}
      </header>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      <main className={styles.contenido}>
        <Outlet />
      </main>
    </div>
  );
}

export default Marco;
