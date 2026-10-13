import { useId, useState, type FormEvent, type ReactElement } from "react";
import { esquemaDatosCliente, type Cliente, type DatosCliente } from "@peluqueria/compartido";
import { mensajeDeError } from "../peticion";
import { erroresDeCliente, type ErroresCliente, type FormularioCliente } from "./erroresCliente";
import styles from "./FichaCliente.module.css";

type Props = {
  cliente: Cliente | null;
  onGuardar: (datos: DatosCliente) => Promise<boolean>;
};

function FichaCliente({ cliente, onGuardar }: Props): ReactElement {
  const prefijo = useId();
  const [datos, setDatos] = useState<FormularioCliente>(() => ({
    nombre: cliente?.nombre ?? "",
    telefono: cliente?.telefono ?? "",
    email: cliente?.email ?? "",
    notas: cliente?.notas ?? "",
  }));
  const [errores, setErrores] = useState<ErroresCliente>({});
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const cambiarCampo = (campo: keyof FormularioCliente, valor: string): void => {
    setDatos((anteriores) => ({ ...anteriores, [campo]: valor }));
    setGuardado(false);
  };

  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (guardando) return;
    setError(null);
    setGuardado(false);
    const resultado = esquemaDatosCliente.safeParse(datos);
    if (!resultado.success) {
      setErrores(erroresDeCliente(resultado.error.issues));
      return;
    }
    setErrores({});
    setGuardando(true);
    try {
      if (await onGuardar(resultado.data)) {
        setDatos(resultado.data);
        setGuardado(true);
      }
    } catch (fallo) {
      setError(mensajeDeError(fallo, "No se pudo guardar el cliente"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className={styles.ficha} noValidate onSubmit={guardar}>
      <h2 className={styles.titulo}>{cliente === null ? "Nuevo cliente" : "Ficha del cliente"}</h2>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      <fieldset className={styles.campos} disabled={guardando}>
        <label htmlFor={`${prefijo}-nombre`}>Nombre</label>
        <input
          id={`${prefijo}-nombre`}
          className={styles.campo}
          value={datos.nombre}
          onChange={(evento) => cambiarCampo("nombre", evento.target.value)}
          autoComplete="name"
          required
          aria-invalid={errores.nombre !== undefined}
          aria-describedby={errores.nombre ? `${prefijo}-error-nombre` : undefined}
        />
        {errores.nombre && <p id={`${prefijo}-error-nombre`} className={styles.error}>{errores.nombre}</p>}

        <label htmlFor={`${prefijo}-telefono`}>Teléfono</label>
        <input
          id={`${prefijo}-telefono`}
          className={styles.campo}
          type="tel"
          value={datos.telefono ?? ""}
          onChange={(evento) => cambiarCampo("telefono", evento.target.value)}
          autoComplete="tel"
          aria-invalid={errores.telefono !== undefined}
          aria-describedby={errores.telefono ? `${prefijo}-error-telefono` : undefined}
        />
        {errores.telefono && <p id={`${prefijo}-error-telefono`} className={styles.error}>{errores.telefono}</p>}

        <label htmlFor={`${prefijo}-email`}>Email</label>
        <input
          id={`${prefijo}-email`}
          className={styles.campo}
          type="email"
          value={datos.email ?? ""}
          onChange={(evento) => cambiarCampo("email", evento.target.value)}
          autoComplete="email"
          aria-invalid={errores.email !== undefined}
          aria-describedby={errores.email ? `${prefijo}-error-email` : undefined}
        />
        {errores.email && <p id={`${prefijo}-error-email`} className={styles.error}>{errores.email}</p>}

        <label htmlFor={`${prefijo}-notas`}>Notas</label>
        <textarea
          id={`${prefijo}-notas`}
          className={styles.campo}
          rows={5}
          value={datos.notas ?? ""}
          onChange={(evento) => cambiarCampo("notas", evento.target.value)}
          aria-invalid={errores.notas !== undefined}
          aria-describedby={errores.notas ? `${prefijo}-error-notas` : undefined}
        />
        {errores.notas && <p id={`${prefijo}-error-notas`} className={styles.error}>{errores.notas}</p>}

        <button className={styles.principal} type="submit">{guardando ? "Guardando…" : "Guardar"}</button>
      </fieldset>
      {guardado && <p role="status" className={styles.confirmacion}>Cliente guardado.</p>}
    </form>
  );
}

export default FichaCliente;
