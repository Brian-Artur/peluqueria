import { useId, useState, type FormEvent, type ReactElement } from "react";
import { esquemaCompetencias, esquemaNivel, type Competencias, type Empleado, type Servicio } from "@peluqueria/compartido";
import { agruparServicios } from "../catalogo/agruparServicios";
import { esAbortada, mensajeDeError } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import { textosNivel } from "./textos";
import { cambiarCompetencia } from "./cambiarCompetencia";
import styles from "./CompetenciasEmpleado.module.css";

type Props = { empleado: Empleado; servicios: Servicio[]; ocupado: boolean; onGuardar: (datos: Competencias) => Promise<void> };

export default function CompetenciasEmpleado({ empleado, servicios, ocupado, onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  const puedeGestionar = puede("empleados:gestionar");
  const prefijo = useId();
  const [competencias, setCompetencias] = useState<Competencias>(empleado.competencias);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const grupos = agruparServicios(servicios.filter((servicio) => servicio.activo));

  const cambiar = (servicioId: number, valor: string): void => {
    const nivel = valor === "" ? null : esquemaNivel.parse(valor);
    setCompetencias((anteriores) => cambiarCompetencia(anteriores, servicioId, nivel));
  };
  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!puedeGestionar || ocupado || guardando) return;
    setError(null);
    const resultado = esquemaCompetencias.safeParse(competencias);
    if (!resultado.success) {
      setError(resultado.error.issues.map((problema) => problema.message).join(". "));
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(resultado.data);
    } catch (fallo) {
      if (!esAbortada(fallo)) setError(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className={styles.seccion} noValidate onSubmit={guardar}>
      <h2 className={styles.titulo}>Competencias</h2>
      <p className={styles.ayuda}>Aprendiz: no lo hace solo, necesita supervisión</p>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      <fieldset className={styles.campos} disabled={!puedeGestionar || ocupado || guardando}>
        {grupos.map((grupo) => <div key={grupo.categoriaId ?? "sin-categoria"}>
          <h3 className={styles.subtitulo}>{grupo.nombre}</h3>
          {grupo.servicios.map((servicio) => <div className={styles.fila} key={servicio.id}>
            <label htmlFor={`${prefijo}-${servicio.id}`}>{servicio.nombre}</label>
            <select id={`${prefijo}-${servicio.id}`} className={styles.campo}
              value={competencias.find((competencia) => competencia.servicio_id === servicio.id)?.nivel ?? ""}
              onChange={(evento) => cambiar(servicio.id, evento.target.value)}>
              <option value="">—</option>
              {esquemaNivel.options.map((nivel) => <option key={nivel} value={nivel}>{textosNivel[nivel]}</option>)}
            </select>
          </div>)}
        </div>)}
        {grupos.length === 0 && <p className={styles.ayuda}>No hay servicios activos.</p>}
        {puedeGestionar && <button type="submit" className={styles.principal}>{guardando ? "Guardando…" : "Guardar competencias"}</button>}
      </fieldset>
    </form>
  );
}
