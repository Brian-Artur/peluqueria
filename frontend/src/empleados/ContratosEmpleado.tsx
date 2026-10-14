import { useId, useState, type FormEvent, type ReactElement } from "react";
import { esquemaBaja, esquemaNuevoContrato, type Baja, type Empleado, type EmpleadoResumen, type NuevoContrato } from "@peluqueria/compartido";
import { esAbortada, mensajeDeError } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import CamposContrato from "./CamposContrato";
import { datosContrato, type FormularioContrato } from "./datosContrato";
import { formatearFecha } from "./formatearFecha";
import { textosContrato } from "./textos";
import styles from "./ContratosEmpleado.module.css";

type Props = {
  empleado: Empleado; empleados: EmpleadoResumen[]; ocupado: boolean;
  onContrato: (datos: NuevoContrato) => Promise<void>;
  onBaja: (datos: Baja) => Promise<void>;
};

export default function ContratosEmpleado({ empleado, empleados, ocupado, onContrato, onBaja }: Props): ReactElement {
  const { puede } = useSesion();
  const puedeGestionar = puede("empleados:gestionar");
  const prefijo = useId();
  const [nuevo, setNuevo] = useState(false);
  const [baja, setBaja] = useState(false);
  const [contrato, setContrato] = useState<FormularioContrato>({ tipo: "plantilla", desde: "", tutor_id: "", empresa: "" });
  const [fecha, setFecha] = useState("");
  const [errorContrato, setErrorContrato] = useState<string | null>(null);
  const [errorBaja, setErrorBaja] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardarContrato = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!puedeGestionar || ocupado || guardando) return;
    setErrorContrato(null);
    const resultado = esquemaNuevoContrato.safeParse(datosContrato(contrato));
    if (!resultado.success) {
      setErrorContrato(resultado.error.issues.map((problema) => problema.message).join(". "));
      return;
    }
    setGuardando(true);
    try {
      await onContrato(resultado.data);
    } catch (fallo) {
      if (!esAbortada(fallo)) setErrorContrato(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  };

  const darDeBaja = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!puedeGestionar || !empleado.activo || ocupado || guardando) return;
    setErrorBaja(null);
    const resultado = esquemaBaja.safeParse({ fecha });
    if (!resultado.success) {
      setErrorBaja(resultado.error.issues.map((problema) => problema.message).join(". "));
      return;
    }
    if (!window.confirm(`¿Dar de baja a ${empleado.nombre} el ${formatearFecha(resultado.data.fecha)}?`)) return;
    setGuardando(true);
    try {
      await onBaja(resultado.data);
    } catch (fallo) {
      if (!esAbortada(fallo)) setErrorBaja(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className={styles.seccion}>
      <h2 className={styles.titulo}>Contratos</h2>
      {!empleado.activo && <p className={styles.ayuda}>De baja</p>}
      <ul className={styles.historial}>
        {empleado.contratos.map((etapa) => <li key={etapa.id}>
          <strong>{textosContrato[etapa.tipo]}</strong>
          <p>{formatearFecha(etapa.desde)} – {etapa.hasta === null ? "vigente" : formatearFecha(etapa.hasta)}</p>
          {etapa.tutor_nombre !== null && <p>Tutor: {etapa.tutor_nombre}</p>}
          {etapa.empresa !== null && <p>Empresa: {etapa.empresa}</p>}
        </li>)}
      </ul>
      {puedeGestionar && <>
        <div className={styles.acciones}>
          <button type="button" className={styles.secundario} disabled={ocupado || guardando} aria-expanded={nuevo}
            onClick={() => setNuevo(!nuevo)}>Nuevo contrato</button>
          {empleado.activo && <button type="button" className={styles.secundario} disabled={ocupado || guardando} aria-expanded={baja}
            onClick={() => setBaja(!baja)}>Dar de baja</button>}
        </div>
        {nuevo && <form noValidate onSubmit={guardarContrato}>
          <p className={styles.ayuda}>El nuevo contrato cierra el vigente el día anterior.</p>
          {errorContrato !== null && <p role="alert" className={styles.error}>{errorContrato}</p>}
          <fieldset className={styles.campos} disabled={ocupado || guardando}>
            <CamposContrato valor={contrato} empleados={empleados} empleadoId={empleado.id} onCambiar={setContrato} />
            <button type="submit" className={styles.principal}>{guardando ? "Guardando…" : "Guardar contrato"}</button>
          </fieldset>
        </form>}
        {baja && empleado.activo && <form noValidate onSubmit={darDeBaja}>
          {errorBaja !== null && <p role="alert" className={styles.error}>{errorBaja}</p>}
          <fieldset className={styles.campos} disabled={ocupado || guardando}>
            <label htmlFor={`${prefijo}-baja`}>Fecha de baja (aaaa-mm-dd)</label>
            <input id={`${prefijo}-baja`} className={styles.campo} value={fecha} placeholder="2026-10-14" required
              onChange={(evento) => setFecha(evento.target.value)} />
            <button type="submit" className={styles.principal}>Confirmar baja</button>
          </fieldset>
        </form>}
      </>}
    </section>
  );
}
