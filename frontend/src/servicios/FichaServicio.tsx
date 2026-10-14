import { useId, useState, type FormEvent, type ReactElement } from "react";
import { esquemaDatosServicio, esquemaDificultad, type Categoria, type DatosServicio, type Dificultad, type Servicio, type TipoRecurso } from "@peluqueria/compartido";
import { opcionesMinutos } from "../catalogo/opcionesMinutos";
import { mensajeDeError } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import { textosDificultad } from "./textosDificultad";
import styles from "./FichaServicio.module.css";

type Props = {
  servicio: Servicio | null;
  categorias: Categoria[];
  tipos: TipoRecurso[];
  onGuardar: (datos: DatosServicio) => Promise<boolean>;
};

function FichaServicio({ servicio, categorias, tipos, onGuardar }: Props): ReactElement {
  const { puede } = useSesion();
  const puedeGestionar = puede("servicios:gestionar");
  const prefijo = useId();
  const [nombre, setNombre] = useState(servicio?.nombre ?? "");
  const [categoriaId, setCategoriaId] = useState<number | null>(servicio?.categoria_id ?? null);
  const [tipoId, setTipoId] = useState<number | null>(servicio?.tipo_recurso_id ?? null);
  const [duracion, setDuracion] = useState(String(servicio?.duracion_min ?? 30));
  const [margen, setMargen] = useState(servicio?.margen_min ?? 0);
  const [dificultad, setDificultad] = useState<Dificultad>(servicio?.dificultad ?? "media");
  const [precio, setPrecio] = useState(servicio?.precio ?? "0.00");
  const [activo, setActivo] = useState(servicio?.activo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const categoriaActual = categorias.find((categoria) => categoria.id === categoriaId);
  const tiposActivos = tipos.filter((tipo) => tipo.activo);
  const tipoActual = tipos.find((tipo) => tipo.id === tipoId);
  const categoriasActivas = categorias.filter((categoria) => categoria.activa);

  const guardar = async (evento: FormEvent<HTMLFormElement>): Promise<void> => {
    evento.preventDefault();
    if (guardando || !puedeGestionar) return;
    setGuardado(false);
    setError(null);
    const resultado = esquemaDatosServicio.safeParse({
      nombre, categoria_id: categoriaId, tipo_recurso_id: tipoId, duracion_min: Number(duracion),
      precio: precio.replace(",", "."), activo, margen_min: margen, dificultad,
    });
    if (!resultado.success) {
      setError(resultado.error.issues.map((problema) => problema.message).join(". "));
      return;
    }
    setGuardando(true);
    try {
      if (await onGuardar(resultado.data)) {
        setNombre(resultado.data.nombre);
        setPrecio(resultado.data.precio);
        setGuardado(true);
      }
    } catch (fallo) {
      setError(mensajeDeError(fallo, "No se pudo guardar el servicio"));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form className={styles.ficha} noValidate onSubmit={guardar} onChange={() => setGuardado(false)}>
      <h2 className={styles.titulo}>{servicio === null ? "Nuevo servicio" : "Ficha del servicio"}</h2>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      <fieldset className={styles.campos} disabled={guardando || !puedeGestionar}>
        <label htmlFor={`${prefijo}-nombre`}>Nombre</label>
        <input id={`${prefijo}-nombre`} className={styles.campo} value={nombre} maxLength={120}
          onChange={(evento) => setNombre(evento.target.value)} required />

        <label htmlFor={`${prefijo}-categoria`}>Categoría</label>
        <select id={`${prefijo}-categoria`} className={styles.campo} value={categoriaId ?? ""}
          onChange={(evento) => setCategoriaId(evento.target.value === "" ? null : Number(evento.target.value))}>
          <option value="">Sin categoría</option>
          {categoriasActivas.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>)}
          {categoriaActual && !categoriaActual.activa && (
            <option value={categoriaActual.id} disabled>{categoriaActual.nombre} (inactiva)</option>
          )}
        </select>

        <label htmlFor={`${prefijo}-recurso`}>Recurso que ocupa</label>
        <select id={`${prefijo}-recurso`} className={styles.campo} value={tipoId ?? ""}
          onChange={(evento) => setTipoId(evento.target.value === "" ? null : Number(evento.target.value))}>
          <option value="">Ninguno</option>
          {tiposActivos.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>)}
          {tipoActual && !tipoActual.activo && <option value={tipoActual.id} disabled>{tipoActual.nombre} (inactivo)</option>}
        </select>

        <label htmlFor={`${prefijo}-duracion`}>Duración (minutos)</label>
        <input id={`${prefijo}-duracion`} className={styles.campo} type="number" min={5} max={600} step={5}
          value={duracion} onChange={(evento) => setDuracion(evento.target.value)} required />

        <label htmlFor={`${prefijo}-margen`}>Margen (minutos)</label>
        <select id={`${prefijo}-margen`} className={styles.campo} value={margen}
          aria-describedby={`${prefijo}-nota-margen`} onChange={(evento) => setMargen(Number(evento.target.value))}>
          {opcionesMinutos(0, 60).map((minutos) => <option key={minutos} value={minutos}>{minutos}</option>)}
        </select>
        <p id={`${prefijo}-nota-margen`} className={styles.ayuda}>preparación y limpieza; se suma al tiempo de cualquier empleado</p>

        <label htmlFor={`${prefijo}-dificultad`}>Dificultad</label>
        <select id={`${prefijo}-dificultad`} className={styles.campo} value={dificultad}
          onChange={(evento) => setDificultad(esquemaDificultad.parse(evento.target.value))}>
          {esquemaDificultad.options.map((valor) => <option key={valor} value={valor}>{textosDificultad[valor]}</option>)}
        </select>

        <label htmlFor={`${prefijo}-precio`}>Precio (€)</label>
        <input id={`${prefijo}-precio`} className={styles.campo} inputMode="decimal" value={precio}
          onChange={(evento) => setPrecio(evento.target.value)} required />

        <label className={styles.estado}>
          <input type="checkbox" checked={activo} onChange={(evento) => setActivo(evento.target.checked)} />
          Activo
        </label>
        {puedeGestionar && <button type="submit" className={styles.principal}>{guardando ? "Guardando…" : "Guardar"}</button>}
      </fieldset>
      {guardado && <p role="status" className={styles.confirmacion}>Servicio guardado.</p>}
    </form>
  );
}

export default FichaServicio;
