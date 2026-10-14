import { useState, type ReactElement } from "react";
import type { DatosTemporada, HorarioSemanal, Temporada } from "@peluqueria/compartido";
import { useSesion } from "../sesion/useSesion";
import { formatearFecha } from "../empleados/formatearFecha";
import FichaTemporada from "./FichaTemporada";
import styles from "./Temporadas.module.css";

type Props = {
  temporadas: Temporada[];
  revision: number;
  onGuardarDatos: (id: number | null, datos: DatosTemporada) => Promise<number>;
  onGuardarHorario: (id: number, semana: HorarioSemanal) => Promise<void>;
};

export default function Temporadas({ temporadas, revision, onGuardarDatos, onGuardarHorario }: Props): ReactElement {
  const { puede } = useSesion();
  const [seleccion, setSeleccion] = useState<number | "nueva" | null>(null);
  const temporada = temporadas.find((elemento) => elemento.id === seleccion) ?? null;
  const guardar = async (id: number | null, datos: DatosTemporada): Promise<void> => {
    const guardada = await onGuardarDatos(id, datos);
    setSeleccion(guardada);
  };
  return <section className={styles.seccion}>
    <h3>Temporadas</h3>
    <ul className={styles.lista}>
      {temporadas.map((elemento) => <li key={elemento.id}>
        <button type="button" aria-expanded={seleccion === elemento.id}
          onClick={() => setSeleccion(seleccion === elemento.id ? null : elemento.id)}>
          {elemento.nombre} · {formatearFecha(elemento.desde)}–{formatearFecha(elemento.hasta)} · {elemento.activa ? "Activa" : "Inactiva"}
        </button>
      </li>)}
    </ul>
    {temporadas.length === 0 && <p>No hay temporadas.</p>}
    {puede("local:gestionar") && <button type="button" onClick={() => setSeleccion("nueva")}>Nueva temporada</button>}
    {seleccion !== null && <>
      <h4>{seleccion === "nueva" ? "Nueva temporada" : temporada?.nombre}</h4>
      <FichaTemporada key={`${seleccion}-${revision}`} temporada={temporada}
        onGuardarDatos={guardar} onGuardarHorario={onGuardarHorario} />
      <button type="button" onClick={() => setSeleccion(null)}>Cerrar temporada</button>
    </>}
  </section>;
}
