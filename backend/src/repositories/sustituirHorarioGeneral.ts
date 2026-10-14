import type { HorarioSemanal } from "@peluqueria/compartido";
import type { Connection } from "mysql2/promise";

export async function sustituirHorarioGeneral(horario: HorarioSemanal, conexion: Connection): Promise<void> {
  await conexion.query("DELETE FROM horario_tramo WHERE temporada_id IS NULL");
  for (const dia of horario) {
    for (const tramo of dia.tramos) {
      await conexion.query(
        "INSERT INTO horario_tramo (temporada_id, dia_semana, abre, cierra) VALUES (NULL, ?, ?, ?)",
        [dia.dia_semana, tramo.abre, tramo.cierra],
      );
    }
  }
}
