import { useId, useState, type FormEvent, type ReactElement } from "react";
import {
  esquemaCrearEmpleado, esquemaDatosEmpleado, normalizarTelefono, separarTelefono,
  type CrearEmpleado, type DatosEmpleado as Datos, type Empleado, type EmpleadoResumen, type Usuario,
} from "@peluqueria/compartido";
import CampoTelefono from "../clientes/CampoTelefono";
import { esAbortada, mensajeDeError } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import CamposContrato from "./CamposContrato";
import { datosContrato, type FormularioContrato } from "./datosContrato";
import styles from "./DatosEmpleado.module.css";

type Props = {
  empleado: Empleado | null;
  empleados: EmpleadoResumen[];
  usuarios: Usuario[] | null;
  errorUsuarios: string | null;
  ocupado: boolean;
  onCrear: (datos: CrearEmpleado) => Promise<void>;
  onGuardar: (datos: Datos) => Promise<void>;
};

export default function DatosEmpleado({ empleado, empleados, usuarios, errorUsuarios, ocupado, onCrear, onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  const puedeGestionar = puede("empleados:gestionar");
  const puedeEnlazar = puede("usuarios:gestionar");
  const prefijo = useId();
  const [nombre, setNombre] = useState(empleado?.nombre ?? "");
  const [pais, setPais] = useState(() => separarTelefono(empleado?.telefono ?? "").pais);
  const [telefono, setTelefono] = useState(() => separarTelefono(empleado?.telefono ?? "").nacional);
  const [email, setEmail] = useState(empleado?.email ?? "");
  const [usuarioId, setUsuarioId] = useState(empleado?.usuario_id?.toString() ?? "");
  const [contrato, setContrato] = useState<FormularioContrato>({ tipo: "plantilla", desde: "", tutor_id: "", empresa: "" });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (!puedeGestionar || ocupado || guardando) return;
    setError(null);
    const datos = {
      nombre, telefono: normalizarTelefono(telefono, pais) ?? telefono, email,
      // Si no se puede elegir usuario, omitir el campo conserva el enlace existente.
      ...(puedeEnlazar && usuarios !== null ? { usuario_id: usuarioId === "" ? null : Number(usuarioId) } : {}),
    };
    setGuardando(true);
    try {
      if (empleado === null) {
        const resultado = esquemaCrearEmpleado.safeParse({ ...datos, contrato: datosContrato(contrato) });
        if (!resultado.success) {
          setError(resultado.error.issues.map((problema) => problema.message).join(". "));
          return;
        }
        await onCrear(resultado.data);
      } else {
        const resultado = esquemaDatosEmpleado.safeParse(datos);
        if (!resultado.success) {
          setError(resultado.error.issues.map((problema) => problema.message).join(". "));
          return;
        }
        await onGuardar(resultado.data);
      }
    } catch (fallo) {
      if (!esAbortada(fallo)) setError(mensajeDeError(fallo));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className={styles.seccion} noValidate onSubmit={guardar}>
      <h2 className={styles.titulo}>{empleado === null ? "Nuevo empleado" : "Datos"}</h2>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      <fieldset className={styles.campos} disabled={!puedeGestionar || guardando || ocupado}>
        <label htmlFor={`${prefijo}-nombre`}>Nombre</label>
        <input id={`${prefijo}-nombre`} className={styles.campo} value={nombre} required autoComplete="name"
          onChange={(evento) => setNombre(evento.target.value)} />
        <label htmlFor={`${prefijo}-telefono`}>Teléfono</label>
        <CampoTelefono id={`${prefijo}-telefono`} pais={pais} numero={telefono} onCambiarPais={setPais} onCambiarNumero={setTelefono} />
        <label htmlFor={`${prefijo}-email`}>Email</label>
        <input id={`${prefijo}-email`} className={styles.campo} type="email" value={email} autoComplete="email"
          onChange={(evento) => setEmail(evento.target.value)} />
        {puedeEnlazar && usuarios !== null ? <>
          <label htmlFor={`${prefijo}-usuario`}>Usuario enlazado</label>
          <select id={`${prefijo}-usuario`} className={styles.campo} value={usuarioId}
            onChange={(evento) => setUsuarioId(evento.target.value)}>
            <option value="">Sin usuario</option>
            {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>
              {usuario.nombre} ({usuario.nombre_usuario}){usuario.activo ? "" : " — Inactivo"}
            </option>)}
          </select>
        </> : <p>Usuario enlazado: {empleado?.usuario_nombre ?? "Sin usuario"}</p>}
        {empleado === null && <>
          <h3 className={styles.subtitulo}>Contrato inicial</h3>
          <CamposContrato valor={contrato} empleados={empleados} onCambiar={setContrato} />
        </>}
        {puedeGestionar && <button type="submit" className={styles.principal}>{guardando ? "Guardando…" : "Guardar"}</button>}
      </fieldset>
      {puedeEnlazar && errorUsuarios !== null && <p role="alert" className={styles.error}>{errorUsuarios}</p>}
    </form>
  );
}
