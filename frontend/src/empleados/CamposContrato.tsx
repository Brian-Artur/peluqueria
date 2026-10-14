import { useId, type ReactElement } from "react";
import { esquemaTipoContrato, type EmpleadoResumen } from "@peluqueria/compartido";
import type { FormularioContrato } from "./datosContrato";
import { textosContrato } from "./textos";
import styles from "./CamposContrato.module.css";

type Props = {
  valor: FormularioContrato;
  empleados: EmpleadoResumen[];
  empleadoId?: number;
  onCambiar: (valor: FormularioContrato) => void;
};

export default function CamposContrato({ valor, empleados, empleadoId, onCambiar }: Props): ReactElement {
  const prefijo = useId();
  const tutores = empleados.filter((empleado) => empleado.activo && empleado.id !== empleadoId);
  return (
    <div className={styles.campos}>
      <label htmlFor={`${prefijo}-tipo`}>Tipo de contrato</label>
      <select id={`${prefijo}-tipo`} className={styles.campo} value={valor.tipo}
        onChange={(evento) => onCambiar({ ...valor, tipo: esquemaTipoContrato.parse(evento.target.value), tutor_id: "", empresa: "" })}>
        {esquemaTipoContrato.options.map((tipo) => <option key={tipo} value={tipo}>{textosContrato[tipo]}</option>)}
      </select>
      <label htmlFor={`${prefijo}-desde`}>Desde (aaaa-mm-dd)</label>
      <input id={`${prefijo}-desde`} className={styles.campo} value={valor.desde} placeholder="2026-10-14" required
        onChange={(evento) => onCambiar({ ...valor, desde: evento.target.value })} />
      {valor.tipo === "practicas" && <>
        <label htmlFor={`${prefijo}-tutor`}>Tutor</label>
        <select id={`${prefijo}-tutor`} className={styles.campo} value={valor.tutor_id}
          onChange={(evento) => onCambiar({ ...valor, tutor_id: evento.target.value })}>
          <option value="">Sin tutor</option>
          {tutores.map((empleado) => <option key={empleado.id} value={empleado.id}>{empleado.nombre}</option>)}
        </select>
      </>}
      {valor.tipo === "externo" && <>
        <label htmlFor={`${prefijo}-empresa`}>Empresa</label>
        <input id={`${prefijo}-empresa`} className={styles.campo} value={valor.empresa} required
          onChange={(evento) => onCambiar({ ...valor, empresa: evento.target.value })} />
      </>}
    </div>
  );
}
