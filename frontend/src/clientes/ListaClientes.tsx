import type { ReactElement } from "react";
import { Link } from "react-router";
import type { Cliente } from "@peluqueria/compartido";
import styles from "./ListaClientes.module.css";

type Props = { clientes: Cliente[]; clienteId: number | null };

function ListaClientes({ clientes, clienteId }: Props): ReactElement {
  return (
    <ul className={styles.lista}>
      {clientes.map((cliente) => {
        const contacto = [cliente.telefono, cliente.email].filter(Boolean).join(" · ");
        const abierto = cliente.id === clienteId;
        return (
          <li key={cliente.id}>
            <Link
              to={`/clientes/${cliente.id}`}
              className={abierto ? `${styles.fila} ${styles.abierta}` : styles.fila}
              aria-current={abierto ? "page" : undefined}
            >
              <span className={styles.nombre}>{cliente.nombre}</span>
              {contacto !== "" && <span className={styles.contacto}>{contacto}</span>}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export default ListaClientes;
