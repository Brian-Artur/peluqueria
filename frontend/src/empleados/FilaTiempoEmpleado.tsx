import { useId, useState, type FormEvent, type ReactElement } from "react";
import { esquemaDatosTiempo, type DatosTiempo, type TiempoEmpleado } from "@peluqueria/compartido";
import { opcionesMinutos } from "../catalogo/opcionesMinutos";
import { esAbortada, mensajeDeError } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import { textosDificultad } from "../servicios/textosDificultad";
import { textosNivel } from "./textos";
import { textoUltimoCambio } from "./textoCambioTiempo";
import styles from "./FilaTiempoEmpleado.module.css";

type Props = {
  tiempo: TiempoEmpleado;
  ocupado: boolean;
  onGuardar: (servicioId: number, datos: DatosTiempo) => Promise<void>;
};

export default function FilaTiempoEmpleado({ tiempo, ocupado, onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  const puedeGestionar = puede("rendimiento:gestionar");
  const prefijo = useId();
  const [duracion, setDuracion] = useState(String(tiempo.duracion_propia ?? ""));
  const [margen, setMargen] = useState(tiempo.margen_propio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bloqueado = !puedeGestionar || ocupado || guardando;

  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (bloqueado) return;
    setError(null);
    const resultado = esquemaDatosTiempo.safeParse({
      duracion_min: duracion === "" ? null : Number(duracion), margen_min: margen,
    });
    if (!resultado.success) {
      setError(resultado.error.issues.map((problema) => problema.message).join(". "));
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(tiempo.servicio_id, resultado.data);
    } catch (fallo) {
      if (!esAbortada(fallo)) setError(mensajeDeError(fallo, "No se pudieron guardar los tiempos"));
    } finally {
      setGuardando(false);
    }
  };

  return <>
    <tr>
      <th scope="row" className={styles.servicio}>
        {tiempo.servicio_nombre}
        <small className={styles.suave}>Dificultad {textosDificultad[tiempo.dificultad]}</small>
        {tiempo.categoria_nombre !== null && <small className={styles.suave}>{tiempo.categoria_nombre}</small>}
      </th>
      <td>{textosNivel[tiempo.nivel]}</td>
      <td>{tiempo.duracion_servicio} min</td>
      <td>
        <select className={styles.campo} aria-label={`Duración propia de ${tiempo.servicio_nombre}`}
          value={duracion} disabled={bloqueado} form={`${prefijo}-formulario`}
          onChange={(evento) => setDuracion(evento.target.value)}>
          <option value="">— (usa la del servicio)</option>
          {opcionesMinutos(5, 600).map((minutos) => <option key={minutos} value={minutos}>{minutos} min</option>)}
        </select>
      </td>
      <td>{tiempo.margen_servicio} min</td>
      <td>
        <select className={styles.campo} aria-label={`Margen propio de ${tiempo.servicio_nombre}`}
          value={margen} disabled={bloqueado} form={`${prefijo}-formulario`}
          onChange={(evento) => setMargen(Number(evento.target.value))}>
          {opcionesMinutos(0, 60).map((minutos) => <option key={minutos} value={minutos}>{minutos} min</option>)}
        </select>
      </td>
      <td><strong>{tiempo.duracion_agendada} min</strong></td>
      {puedeGestionar && <td>
        <form id={`${prefijo}-formulario`} noValidate onSubmit={guardar}>
          <button type="submit" className={styles.principal} disabled={bloqueado}
            aria-label={`Guardar tiempos de ${tiempo.servicio_nombre}`}>{guardando ? "Guardando…" : "Guardar"}</button>
        </form>
      </td>}
    </tr>
    {(tiempo.ultimo_cambio !== null || error !== null) && <tr>
      <td colSpan={puedeGestionar ? 8 : 7} className={styles.detalle}>
        {tiempo.ultimo_cambio !== null && <p className={styles.suave}>{textoUltimoCambio(tiempo.ultimo_cambio)}</p>}
        {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      </td>
    </tr>}
  </>;
}
