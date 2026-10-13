import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { crearConexionScripts } from "./conexionScripts";

interface FilaCliente extends RowDataPacket {
  id: number;
}

async function comprobarClientesVacios(conexion: Connection): Promise<void> {
  const [filas] = await conexion.query<FilaCliente[]>("SELECT id FROM cliente LIMIT 1");
  if (filas.length > 0) {
    throw new Error("No se pueden sembrar datos de ejemplo: la tabla cliente ya tiene filas.");
  }
}

async function sembrar(): Promise<void> {
  const conexion = await crearConexionScripts();
  try {
    await comprobarClientesVacios(conexion);
    const archivoSemilla = resolve(__dirname, "../../semillas/demo.sql");
    const sql = await readFile(archivoSemilla, "utf8");
    await conexion.query(sql);
    console.log("Datos de ejemplo sembrados");
  } finally {
    await conexion.end();
  }
}

void sembrar().catch((error: unknown): void => {
  console.error("No se pudieron sembrar los datos de ejemplo:", error);
  process.exitCode = 1;
});
