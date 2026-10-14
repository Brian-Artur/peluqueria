import type { ReactElement } from "react";
import { Navigate } from "react-router";
import { useSesion } from "../sesion/useSesion";
import Horario from "./Horario";
import styles from "./PaginaHorario.module.css";

function PaginaHorario(): ReactElement {
  const { puede } = useSesion();
  if (!puede("citas:ver")) return <Navigate to="/agenda" replace />;
  return (
    <section className={styles.pagina} aria-labelledby="titulo-horario">
      <h1 id="titulo-horario" className={styles.titulo}>Horario</h1>
      <Horario />
    </section>
  );
}

export default PaginaHorario;
