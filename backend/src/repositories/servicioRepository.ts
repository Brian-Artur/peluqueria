import type { DatosServicio, Servicio } from "@peluqueria/compartido";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

interface FilaServicio extends RowDataPacket {
  id: number;
  nombre: string;
  categoria_id: number | null;
  categoria_nombre: string | null;
  tipo_recurso_id: number | null;
  tipo_recurso_nombre: string | null;
  activo: number;
  duracion_min: number;
  margen_min: number;
  dificultad: Servicio["dificultad"];
  precio: string;
}

function traducirServicio(fila: FilaServicio): Servicio {
  return {
    id: fila.id,
    nombre: fila.nombre,
    categoria_id: fila.categoria_id,
    categoria_nombre: fila.categoria_nombre,
    tipo_recurso_id: fila.tipo_recurso_id,
    tipo_recurso_nombre: fila.tipo_recurso_nombre,
    activo: Boolean(fila.activo),
    duracion_min: fila.duracion_min,
    margen_min: fila.margen_min,
    dificultad: fila.dificultad,
    precio: fila.precio,
  };
}

const consultaServicio = `SELECT s.id, s.nombre, s.categoria_id, c.nombre AS categoria_nombre,
  s.tipo_recurso_id, t.nombre AS tipo_recurso_nombre, s.duracion_min, s.margen_min, s.dificultad, s.precio, s.activo
  FROM servicio s LEFT JOIN categoria_servicio c ON c.id = s.categoria_id
  LEFT JOIN tipo_recurso t ON t.id = s.tipo_recurso_id`;

export async function findAllServicios(incluirInactivos: boolean = false): Promise<Servicio[]> {
  const [filas] = await pool.query<FilaServicio[]>(
    `${consultaServicio} WHERE (? = TRUE OR s.activo = TRUE) ORDER BY s.nombre, s.id`,
    [incluirInactivos]
  );
  return filas.map(traducirServicio);
}

export async function findServicioById(id: number): Promise<Servicio | null> {
  const [filas] = await pool.query<FilaServicio[]>(
    `${consultaServicio} WHERE s.id = ?`,
    [id]
  );
  const fila = filas[0];
  if (!fila) return null;
  return traducirServicio(fila);
}

export async function insertarServicio(datos: DatosServicio): Promise<number> {
  const [resultado] = await pool.query<ResultSetHeader>(
    "INSERT INTO servicio (nombre, categoria_id, tipo_recurso_id, duracion_min, margen_min, dificultad, precio, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [datos.nombre, datos.categoria_id, datos.tipo_recurso_id, datos.duracion_min, datos.margen_min, datos.dificultad, datos.precio, datos.activo]
  );
  return resultado.insertId;
}

export async function actualizarServicio(id: number, datos: DatosServicio): Promise<void> {
  await pool.query(
    "UPDATE servicio SET nombre = ?, categoria_id = ?, tipo_recurso_id = ?, duracion_min = ?, margen_min = ?, dificultad = ?, precio = ?, activo = ? WHERE id = ?",
    [datos.nombre, datos.categoria_id, datos.tipo_recurso_id, datos.duracion_min, datos.margen_min, datos.dificultad, datos.precio, datos.activo, id]
  );
}
