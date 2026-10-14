import type { ReactElement } from "react";
import type { Categoria, DatosCategoria } from "@peluqueria/compartido";
import { useSesion } from "../sesion/useSesion";
import FilaCategoria from "./FilaCategoria";
import styles from "./GestionCategorias.module.css";

type Props = {
  categorias: Categoria[];
  onGuardar: (id: number | null, datos: DatosCategoria) => Promise<void>;
};

function GestionCategorias({ categorias, onGuardar }: Props): ReactElement | null {
  const { puede } = useSesion();
  if (!puede("servicios:gestionar")) return null;
  return (
    <section className={styles.bloque} aria-label="Gestión de categorías">
      <h2 className={styles.titulo}>Categorías</h2>
      <p className={styles.ayuda}>Desactivar una categoría conserva sus servicios y deja de ofrecerla para nuevas asignaciones.</p>
      {categorias.map((categoria) => (
        <FilaCategoria key={`${categoria.id}-${categoria.nombre}-${categoria.activa}`} categoria={categoria} onGuardar={onGuardar} />
      ))}
      <FilaCategoria categoria={null} onGuardar={onGuardar} />
    </section>
  );
}

export default GestionCategorias;
