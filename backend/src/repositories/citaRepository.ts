import { pool } from "../db";

export async function findAllCitas() {
  const [rows] = await pool.query(
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
  return rows;
}

export async function createCita(
  cliente_id: number,
  servicio_id: number,
  inicio: Date,
  fin: Date
) {
  const [result] = await pool.query(
    "INSERT INTO cita (cliente_id, servicio_id, inicio, fin) VALUES (?, ?, ?, ?)",
    [cliente_id, servicio_id, inicio, fin]
  );
  return (result as { insertId: number }).insertId;
}

export async function findCitaById(id: number) {
  const [rows] = await pool.query(
    "SELECT id, cliente_id, servicio_id, inicio, fin, estado FROM cita WHERE id = ?",
    [id]
  );
  const citas = rows as { id: number; servicio_id: number; estado: string }[];
  return citas[0] ?? null;
}

export async function updateInicioFin(id: number, inicio: Date, fin: Date) {
  await pool.query("UPDATE cita SET inicio = ?, fin = ? WHERE id = ?", [
    inicio,
    fin,
    id,
  ]);
}

export async function updateEstado(id: number, estado: string) {
  await pool.query("UPDATE cita SET estado = ? WHERE id = ?", [estado, id]);
}