import type { Servicio } from "@peluqueria/compartido";
import type { RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

interface FilaServicio extends RowDataPacket {
  id: number;
  nombre: string;
  duracion_min: number;
  precio: string;
}

function traducirServicio(fila: FilaServicio): Servicio {
  return {
    id: fila.id,
    nombre: fila.nombre,
    duracion_min: fila.duracion_min,
    precio: fila.precio,
  };
}

export async function findAllServicios(): Promise<Servicio[]> {
  const [filas] = await pool.query<FilaServicio[]>(
    "SELECT id, nombre, duracion_min, precio FROM servicio ORDER BY nombre"
  );
  return filas.map(traducirServicio);
}

export async function findServicioById(id: number): Promise<Servicio | null> {
  const [filas] = await pool.query<FilaServicio[]>(
    "SELECT id, nombre, duracion_min, precio FROM servicio WHERE id = ?",
    [id]
  );
  const fila = filas[0];
  if (!fila) return null;
  return traducirServicio(fila);
}
