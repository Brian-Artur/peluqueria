import { useState, type ReactElement } from "react";
import type { Rol } from "@peluqueria/compartido";
import { NavLink, Outlet } from "react-router";
import { mensajeDeError } from "./peticion";
import { useSesion } from "./sesion/useSesion";
import styles from "./Marco.module.css";

const nombresRol: Record<Rol, string> = {
  admin: "Admin",
  encargado: "Encargado",
  recepcion: "Recepción",
  empleado: "Empleado",
};

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
        </nav>
        {usuario !== null && (
          <div className={styles.sesion}>
            <span>{usuario.nombre}</span>
            <span className={styles.rol}>{nombresRol[usuario.rol]}</span>
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
