import { useEffect, useState, type ReactElement } from "react";
import { Link, Navigate } from "react-router";
import { z } from "zod";
import { esquemaEmpleadoResumen, esquemaServicio, esquemaCategoria, esquemaCompetenciaResumen } from "@peluqueria/compartido";
import { esAbortada, mensajeDeError, pedirJson } from "../peticion";
import { useSesion } from "../sesion/useSesion";
import { construirMatriz, type MatrizCompetencias } from "./matrizCompetencias";
import { abreviaturasNivel, textosNivel } from "./textos";
import styles from "./CuadroCompetencias.module.css";

export default function CuadroCompetencias(): ReactElement {
  const { puede } = useSesion();
  const puedeVer = puede("empleados:ver");
  const [matriz, setMatriz] = useState<MatrizCompetencias | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!puedeVer) return;
    const controlador = new AbortController();
    const { signal } = controlador;
    const cargar = async (): Promise<void> => {
      try {
        const [empleados, servicios, categorias, competencias] = await Promise.all([
          pedirJson("/api/empleados", z.array(esquemaEmpleadoResumen), { signal }),
          pedirJson("/api/servicios", z.array(esquemaServicio), { signal }),
          pedirJson("/api/categorias", z.array(esquemaCategoria), { signal }),
          pedirJson("/api/competencias", z.array(esquemaCompetenciaResumen), { signal }),
        ]);
        signal.throwIfAborted();
        const catalogo = servicios.map((servicio) => ({
          ...servicio,
          categoria_nombre: categorias.find((categoria) => categoria.id === servicio.categoria_id)?.nombre ?? servicio.categoria_nombre,
        }));
        setMatriz(construirMatriz(empleados, catalogo, competencias));
      } catch (fallo) {
        if (!signal.aborted && !esAbortada(fallo)) setError(mensajeDeError(fallo));
      }
    };
    void cargar();
    return () => controlador.abort();
  }, [puedeVer]);

  if (!puedeVer) return <Navigate to="/agenda" replace />;
  return (
    <section className={styles.pagina}>
      <h1>Cuadro de competencias</h1>
      <Link className={styles.enlace} to="/empleados">Volver a empleados</Link>
      <p className={styles.leyenda}>
        <span className={styles.aprendiz}>A: Aprendiz</span>
        <span className={styles.autonomo}>Au: Autónomo</span>
        <span className={styles.experto}>E: Experto</span>
      </p>
      <p className={styles.ayuda}>Aprendiz: no lo hace solo, necesita supervisión</p>
      {error !== null && <p role="alert" className={styles.error}>{error}</p>}
      {matriz === null && error === null && <p role="status">Cargando competencias…</p>}
      {matriz !== null && <>
        {matriz.servicios.length === 0 && <p className={styles.ayuda}>No hay servicios activos.</p>}
        {matriz.filas.length === 0 && <p className={styles.ayuda}>No hay empleados activos.</p>}
        {matriz.servicios.length > 0 && <div className={styles.desplazamiento} role="region" aria-label="Competencias por empleado y servicio" tabIndex={0}>
          <table className={styles.tabla}>
            <caption>Empleados activos y servicios activos</caption>
            <colgroup><col /></colgroup>
            {matriz.grupos.map((grupo) => <colgroup key={grupo.categoriaId ?? "sin-categoria"} span={grupo.servicios.length} />)}
            <thead>
              <tr>
                <th className={styles.nombre} scope="col" rowSpan={2}>Empleado</th>
                {matriz.grupos.map((grupo) => <th key={grupo.categoriaId ?? "sin-categoria"} scope="colgroup" colSpan={grupo.servicios.length}>{grupo.nombre}</th>)}
              </tr>
              <tr>{matriz.servicios.map((servicio) => <th key={servicio.id} scope="col">{servicio.nombre}</th>)}</tr>
            </thead>
            <tbody>
              {matriz.filas.map((fila) => <tr key={fila.empleado.id}>
                <th className={styles.nombre} scope="row"><Link to={`/empleados/${fila.empleado.id}`}>{fila.empleado.nombre}</Link></th>
                {fila.niveles.map((nivel, indice) => <td key={matriz.servicios[indice].id} className={nivel === null ? undefined : styles[nivel]}
                  aria-label={nivel === null ? "Sin competencia" : textosNivel[nivel]} title={nivel === null ? "Sin competencia" : textosNivel[nivel]}>
                  {nivel === null ? "—" : abreviaturasNivel[nivel]}
                </td>)}
              </tr>)}
            </tbody>
            <tfoot><tr>
              <th className={styles.nombre} scope="row">Huecos</th>
              {matriz.avisos.map((aviso, indice) => <td key={matriz.servicios[indice].id} className={aviso === null ? undefined : styles.aviso}>{aviso ?? "—"}</td>)}
            </tr></tfoot>
          </table>
        </div>}
      </>}
    </section>
  );
}
