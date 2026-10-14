import type { ReactElement } from "react";
import { Navigate } from "react-router";
import { useSesion } from "../sesion/useSesion";
import Recursos from "./Recursos";
import styles from "./PaginaLocal.module.css";

function PaginaLocal(): ReactElement {
  const { puede } = useSesion();
  if (!puede("citas:ver")) return <Navigate to="/agenda" replace />;
  return (
    <div className={styles.pagina}>
      <h1>Local</h1>
      <Recursos />
    </div>
  );
}

export default PaginaLocal;
