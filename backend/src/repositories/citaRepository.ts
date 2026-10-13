import type { Cita, EstadoCita } from "@peluqueria/compartido";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db";

// La consulta por id no incluye los nombres de las tablas relacionadas.
type CitaSinNombres = Omit<Cita, "cliente_nombre" | "servicio_nombre">;

interface FilaCita extends RowDataPacket {
  id: number;
  inicio: Date;
  fin: Date;
  estado: EstadoCita;
  cliente_id: number;
  servicio_id: number;
}

interface FilaCitaConNombres extends FilaCita {
  cliente_nombre: string;
  servicio_nombre: string;
}

function traducirCitaSinNombres(fila: FilaCita): CitaSinNombres {
  return {
    id: fila.id,
    inicio: fila.inicio.toISOString(),
    fin: fila.fin.toISOString(),
    estado: fila.estado,
    cliente_id: fila.cliente_id,
    servicio_id: fila.servicio_id,
  };
}

function traducirCita(fila: FilaCitaConNombres): Cita {
  return {
    ...traducirCitaSinNombres(fila),
    cliente_nombre: fila.cliente_nombre,
    servicio_nombre: fila.servicio_nombre,
  };
}

export async function findAllCitas(): Promise<Cita[]> {
  const [filas] = await pool.query<FilaCitaConNombres[]>(
    `SELECT
       cita.id,
       cita.inicio,
       cita.fin,
       cita.estado,
       cliente.id   AS cliente_id,
       cliente.nombre AS cliente_nombre,
       servicio.id   AS servicio_id,
       servicio.nombre AS servicio_nombre
     FROM cita
     JOIN cliente  ON cita.cliente_id  = cliente.id
     JOIN servicio ON cita.servicio_id = servicio.id
     ORDER BY cita.inicio`
  );
  return filas.map(traducirCita);
}

export async function createCita(
  cliente_id: number,
  servicio_id: number,
  inicio: Date,
  fin: Date
): Promise<number> {
  const [resultado] = await pool.query<ResultSetHeader>(
    "INSERT INTO cita (cliente_id, servicio_id, inicio, fin) VALUES (?, ?, ?, ?)",
    [cliente_id, servicio_id, inicio, fin]
  );
  return resultado.insertId;
}

export async function findCitaById(id: number): Promise<CitaSinNombres | null> {
  const [filas] = await pool.query<FilaCita[]>(
    "SELECT id, cliente_id, servicio_id, inicio, fin, estado FROM cita WHERE id = ?",
    [id]
  );
  const fila = filas[0];
  if (!fila) return null;
  return traducirCitaSinNombres(fila);
}

export async function updateInicioFin(id: number, inicio: Date, fin: Date): Promise<void> {
  await pool.query("UPDATE cita SET inicio = ?, fin = ? WHERE id = ?", [
    inicio,
    fin,
    id,
  ]);
}

export async function updateEstado(id: number, estado: EstadoCita): Promise<void> {
  await pool.query("UPDATE cita SET estado = ? WHERE id = ?", [estado, id]);
}
