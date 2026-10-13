import type { ReactElement } from "react";
import { Link } from "react-router";
import type { Usuario } from "@peluqueria/compartido";
import { textoRol } from "./textoRol";
import styles from "./ListaUsuarios.module.css";

type Props = { usuarios: Usuario[]; usuarioId: number | null };

export default function ListaUsuarios({ usuarios, usuarioId }: Props): ReactElement {
  return (
    <ul className={styles.lista}>
      {usuarios.map((usuario) => (
        <li key={usuario.id}>
          <Link to={`/usuarios/${usuario.id}`} className={styles.fila} aria-current={usuario.id === usuarioId ? "page" : undefined}>
            <strong className={styles.nombre}>{usuario.nombre}</strong>
            <span>·</span><span className={styles.usuario}>{usuario.nombre_usuario}</span>
            <span>·</span><span>{textoRol(usuario.rol)}</span>
            {!usuario.activo && <span className={styles.inactivo}>Inactivo</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
