import type { Connection, RowDataPacket } from "mysql2/promise";

export async function bloquearConfiguracionHorario(conexion: Connection): Promise<boolean> {
  // La fila única serializa los cambios: dos temporadas nuevas no pueden comprobar el mismo hueco a la vez.
  const [filas] = await conexion.query<RowDataPacket[]>("SELECT id FROM local WHERE id = ? FOR UPDATE", [1]);
  return filas.length > 0;
}
