import type { ReactElement } from "react";
import Calendario from "./Calendario";
import styles from "./App.module.css";

function App(): ReactElement {
  return (
    <div className={styles.pagina}>
      <h1 className={styles.titulo}>Agenda</h1>
      <Calendario />
    </div>
  );
}
export default App;
