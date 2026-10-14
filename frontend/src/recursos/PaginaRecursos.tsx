import type { ReactElement } from "react";
import { Navigate } from "react-router";
import { useSesion } from "../sesion/useSesion";
import Recursos from "./Recursos";
import styles from "./PaginaRecursos.module.css";

function PaginaRecursos(): ReactElement {
  const { puede } = useSesion();
  if (!puede("citas:ver")) return <Navigate to="/agenda" replace />;
  return (
    <section className={styles.pagina} aria-labelledby="titulo-recursos">
      <h1 id="titulo-recursos" className={styles.titulo}>Recursos</h1>
      <Recursos />
    </section>
  );
}

export default PaginaRecursos;
