import {
  esquemaEmpleadoResumen, type DatosEmpleado, type Empleado, type EmpleadoResumen,
} from "@peluqueria/compartido";
import type { Connection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { pool } from "../db";
import { ErrorConflicto } from "../errores";

interface FilaEmpleado extends RowDataPacket {
  id: number;
  nombre: string;
  telefono: string | null;
  email: string | null;
  activo: number;
  usuario_id: number | null;
  usuario_nombre: string | null;
  contrato_vigente: EmpleadoResumen["contrato_vigente"];
  num_competencias: number;
}

type EmpleadoBloqueado = Pick<Empleado, "id" | "activo" | "usuario_id">;
type DetalleEmpleado = Omit<Empleado, "contratos" | "competencias">;

const consultaEmpleado = `SELECT e.id, e.nombre, e.telefono, e.email, e.activo,
  e.usuario_id, u.nombre AS usuario_nombre,
  (SELECT c.tipo FROM contrato_empleado c WHERE c.empleado_id = e.id AND c.hasta IS NULL
    ORDER BY c.desde DESC, c.id DESC LIMIT 1) AS contrato_vigente,
  (SELECT COUNT(*) FROM competencia c WHERE c.empleado_id = e.id) AS num_competencias
  FROM empleado e LEFT JOIN usuario u ON u.id = e.usuario_id`;

function traducirResumen(fila: FilaEmpleado): EmpleadoResumen {
  return esquemaEmpleadoResumen.parse({ ...fila, activo: Boolean(fila.activo), num_competencias: Number(fila.num_competencias) });
}

export async function consultarEmpleados(incluirInactivos: boolean): Promise<EmpleadoResumen[]> {
  const [filas] = await pool.query<FilaEmpleado[]>(
    `${consultaEmpleado} WHERE (? = TRUE OR e.activo = TRUE) ORDER BY e.nombre, e.id`, [incluirInactivos]
  );
  return filas.map(traducirResumen);
}

export async function buscarEmpleadoPorId(id: number): Promise<DetalleEmpleado | null> {
  const [filas] = await pool.query<FilaEmpleado[]>(`${consultaEmpleado} WHERE e.id = ?`, [id]);
  const fila = filas[0];
  if (!fila) return null;
  return { ...traducirResumen(fila), usuario_id: fila.usuario_id, usuario_nombre: fila.usuario_nombre };
}

export async function bloquearEmpleado(id: number, conexion: Connection): Promise<EmpleadoBloqueado | null> {
  // Todas las escrituras del historial y las competencias se serializan sobre esta fila.
  const [filas] = await conexion.query<FilaEmpleado[]>(
    "SELECT id, activo, usuario_id FROM empleado WHERE id = ? FOR UPDATE", [id]
  );
  const fila = filas[0];
  if (!fila) return null;
  return { id: fila.id, activo: Boolean(fila.activo), usuario_id: fila.usuario_id };
}

export async function buscarEmpleadoPorUsuario(usuarioId: number, conexion: Connection): Promise<number | null> {
  const [filas] = await conexion.query<FilaEmpleado[]>(
    "SELECT id FROM empleado WHERE usuario_id = ? FOR UPDATE", [usuarioId]
  );
  return filas[0]?.id ?? null;
}

function traducirUsuarioDuplicado(error: unknown): never {
  if (typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY") {
    throw new ErrorConflicto("Ese usuario ya está enlazado a otro empleado");
  }
  throw error;
}

export async function insertarEmpleado(datos: DatosEmpleado, conexion: Connection): Promise<number> {
  try {
    const [resultado] = await conexion.query<ResultSetHeader>(
      "INSERT INTO empleado (nombre, telefono, email, usuario_id) VALUES (?, ?, ?, ?)",
      [datos.nombre, datos.telefono, datos.email, datos.usuario_id ?? null]
    );
    return resultado.insertId;
  } catch (error) {
    return traducirUsuarioDuplicado(error);
  }
}

export async function actualizarEmpleado(id: number, datos: DatosEmpleado, conexion: Connection): Promise<void> {
  try {
    await conexion.query(
      "UPDATE empleado SET nombre = ?, telefono = ?, email = ?, usuario_id = ? WHERE id = ?",
      [datos.nombre, datos.telefono, datos.email, datos.usuario_id ?? null, id]
    );
  } catch (error) {
    traducirUsuarioDuplicado(error);
  }
}

export async function cambiarActividadEmpleado(id: number, activo: boolean, conexion: Connection): Promise<void> {
  await conexion.query("UPDATE empleado SET activo = ? WHERE id = ?", [activo, id]);
}
