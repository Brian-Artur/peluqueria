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