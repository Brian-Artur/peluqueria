import type { ReactElement } from "react";
import { NavLink, Outlet } from "react-router";
import styles from "./Marco.module.css";

function Marco(): ReactElement {
  return (
    <div className={styles.pagina}>
      <header className={styles.barra}>
        <span className={styles.nombre}>Peluquería</span>
        <nav className={styles.navegacion} aria-label="Navegación principal">
          <NavLink to="/agenda" className={styles.enlace}>Agenda</NavLink>
          <NavLink to="/clientes" className={styles.enlace}>Clientes</NavLink>
        </nav>
      </header>
      <main className={styles.contenido}>
        <Outlet />
      </main>
    </div>
  );
}

export default Marco;
