import { useId, useState, type FormEvent, type ReactElement } from "react";
import {
  esquemaCrearUsuario, esquemaEditarUsuario, esquemaRol,
  type CrearUsuario, type EditarUsuario, type Rol, type Usuario,
} from "@peluqueria/compartido";
import { esAbortada, mensajeDeError } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import { comprobarRepeticion } from "./comprobarRepeticion";
import { textoRol } from "./textoRol";
import PonerContrasenaNueva from "./PonerContrasenaNueva";
import styles from "./FichaUsuario.module.css";

type Props = {
  usuario: Usuario | null;
  onCrear: (datos: CrearUsuario) => Promise<void>;
  onEditar: (datos: EditarUsuario) => Promise<Usuario>;
  onContrasena: (contrasena: string) => Promise<void>;
};

export default function FichaUsuario({ usuario, onCrear, onEditar, onContrasena }: Props): ReactElement {
  const { usuario: conectado, puede } = useSesion();
  const puedeGestionar = puede("usuarios:gestionar");
  const esPropio = usuario !== null && usuario.id === conectado?.id;
  const prefijo = useId();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [datos, setDatos] = useState<EditarUsuario>(() => ({
    nombre: usuario?.nombre ?? "",
    rol: usuario?.rol ?? "empleado",
    activo: usuario?.activo ?? true,
  }));
  const [contrasena, setContrasena] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (guardando || !puedeGestionar) return;
    setError(null);
    setGuardado(false);
    const resultado = usuario === null
      ? esquemaCrearUsuario.safeParse({ ...datos, nombre_usuario: nombreUsuario, contrasena })
      : esquemaEditarUsuario.safeParse(datos);
    if (!resultado.success) {
      setError(resultado.error.issues[0]?.message ?? "Revisa los datos del usuario");
      return;
    }
    if (usuario === null) {
      const falloRepeticion = comprobarRepeticion(contrasena, repetida);
      if (falloRepeticion !== null) {
        setError(falloRepeticion);
        return;
      }
    }

    setGuardando(true);
    try {
      if ("contrasena" in resultado.data) {
        await onCrear(resultado.data);
      } else {
        const actualizado = await onEditar(resultado.data);
        setDatos({ nombre: actualizado.nombre, rol: actualizado.rol, activo: actualizado.activo });
        setGuardado(true);
      }
    } catch (fallo) {
      if (!esAbortada(fallo)) setError(mensajeDeError(fallo, "No se pudo guardar el usuario"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className={styles.ficha}>
      <form noValidate onSubmit={guardar} onChange={() => setGuardado(false)}>
        <h2 className={styles.titulo}>{usuario === null ? "Nuevo usuario" : "Ficha del usuario"}</h2>
        {error !== null && <p role="alert" className={styles.error}>{error}</p>}
        {usuario !== null && <p className={styles.ayuda}>Usuario: {usuario.nombre_usuario}</p>}
        <fieldset className={styles.campos} disabled={guardando || !puedeGestionar}>
          {usuario === null && (
            <>
              <label htmlFor={`${prefijo}-usuario`}>Nombre de usuario</label>
              <input
                id={`${prefijo}-usuario`}
                className={styles.campo}
                value={nombreUsuario}
                onChange={(evento) => setNombreUsuario(evento.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                minLength={3}
                maxLength={50}
                required
              />
            </>
          )}
          <label htmlFor={`${prefijo}-nombre`}>Nombre</label>
          <input
            id={`${prefijo}-nombre`}
            className={styles.campo}
            value={datos.nombre}
            onChange={(evento) => setDatos({ ...datos, nombre: evento.target.value })}
            autoComplete="name"
            maxLength={120}
            required
          />
          <label htmlFor={`${prefijo}-rol`}>Rol</label>
          <select
            id={`${prefijo}-rol`}
            className={styles.campo}
            value={datos.rol}
            disabled={esPropio}
            aria-describedby={esPropio ? `${prefijo}-nota` : undefined}
            onChange={(evento) => setDatos({ ...datos, rol: evento.target.value as Rol })}
          >
            {esquemaRol.options.map((rol) => <option key={rol} value={rol}>{textoRol(rol)}</option>)}
          </select>
          {usuario !== null && (
            <label className={styles.casilla}>
              <input
                type="checkbox"
                checked={datos.activo}
                disabled={esPropio}
                aria-describedby={esPropio ? `${prefijo}-nota` : undefined}
                onChange={(evento) => setDatos({ ...datos, activo: evento.target.checked })}
              />
              Activo
            </label>
          )}
          {esPropio && <p id={`${prefijo}-nota`} className={styles.ayuda}>No puedes cambiar tu propio rol ni desactivarte</p>}
          {usuario === null && (
            <>
              <label htmlFor={`${prefijo}-clave`}>Contraseña</label>
              <input
                id={`${prefijo}-clave`}
                className={styles.campo}
                type="password"
                value={contrasena}
                onChange={(evento) => setContrasena(evento.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={200}
                required
              />
              <label htmlFor={`${prefijo}-repetida`}>Repetir contraseña</label>
              <input
                id={`${prefijo}-repetida`}
                className={styles.campo}
                type="password"
                value={repetida}
                onChange={(evento) => setRepetida(evento.target.value)}
                autoComplete="new-password"
                maxLength={200}
                required
              />
            </>
          )}
          {puedeGestionar && <button className={styles.principal} type="submit">{guardando ? "Guardando…" : "Guardar"}</button>}
        </fieldset>
        {guardado && <p role="status" className={styles.confirmacion}>Usuario guardado.</p>}
      </form>
      {usuario !== null && puedeGestionar && <PonerContrasenaNueva onGuardar={onContrasena} />}
    </div>
  );
}
