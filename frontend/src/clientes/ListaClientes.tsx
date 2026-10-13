import { useId, useState, type ReactElement } from "react";
import { Link } from "react-router";
import { formatearTelefono, type Cliente } from "@peluqueria/compartido";
import styles from "./ListaClientes.module.css";

type Props = { clientes: Cliente[]; clienteId: number | null };

function ListaClientes({ clientes, clienteId }: Props): ReactElement {
  const prefijo = useId();
  const [notasAbiertas, setNotasAbiertas] = useState<Set<number>>(() => new Set());

  const alternarNotas = (id: number): void => {
    setNotasAbiertas((anteriores) => {
      const siguientes = new Set(anteriores);
      if (siguientes.has(id)) {
        siguientes.delete(id);
      } else {
        siguientes.add(id);
      }
      return siguientes;
    });
  };

  return (
    <ul className={styles.lista}>
      {clientes.map((cliente) => {
        const abierto = cliente.id === clienteId;
        const telefono = formatearTelefono(cliente.telefono ?? "");
        const notasVisibles = notasAbiertas.has(cliente.id);
        const notasId = `${prefijo}-notas-${cliente.id}`;
        return (
          <li key={cliente.id}>
            <div className={abierto ? `${styles.fila} ${styles.abierta}` : styles.fila}>
              <Link
                to={`/clientes/${cliente.id}`}
                className={styles.nombre}
                aria-current={abierto ? "page" : undefined}
                title={cliente.nombre}
              >
                {cliente.nombre}
              </Link>
              <span className={styles.telefono} title={telefono}>{telefono}</span>
              <span className={styles.email} title={cliente.email ?? undefined}>{cliente.email}</span>
              {cliente.notas && (
                <button
                  type="button"
                  className={styles.botonNotas}
                  aria-expanded={notasVisibles}
                  aria-controls={notasId}
                  aria-label={notasVisibles ? "Ocultar notas" : "Ver notas"}
                  onClick={() => alternarNotas(cliente.id)}
                >
                  <span aria-hidden="true">✎</span>
                </button>
              )}
            </div>
            {cliente.notas && notasVisibles && <p id={notasId} className={styles.notas}>{cliente.notas}</p>}
          </li>
        );
      })}
    </ul>
  );
}

export default ListaClientes;
