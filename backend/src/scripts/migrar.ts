import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Connection, RowDataPacket } from "mysql2/promise";
import { ordenarArchivosMigracion } from "./archivosMigracion";
import { crearConexionScripts } from "./conexionScripts";

const carpetaMigraciones = resolve(__dirname, "../../migraciones");

interface FilaMigracion extends RowDataPacket {
  nombre: string;
}

async function leerArchivosMigracion(): Promise<string[]> {
  const entradas = await readdir(carpetaMigraciones, { withFileTypes: true });
  const nombres: string[] = [];
  for (const entrada of entradas) {
    if (entrada.isFile()) {
      nombres.push(entrada.name);
    }
  }
  return ordenarArchivosMigracion(nombres);
}

async function leerAplicadas(conexion: Connection): Promise<Set<string>> {
  await conexion.query(`
    CREATE TABLE IF NOT EXISTS migracion (
      nombre VARCHAR(255) PRIMARY KEY,
      aplicada_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const [filas] = await conexion.query<FilaMigracion[]>("SELECT nombre FROM migracion");
  const aplicadas = new Set<string>();
  for (const fila of filas) {
    aplicadas.add(fila.nombre);
  }
  return aplicadas;
}

async function aplicarMigracion(conexion: Connection, nombre: string): Promise<void> {
  try {
    const sql = await readFile(resolve(carpetaMigraciones, nombre), "utf8");
    // Cada migración debe contener un único cambio: el DDL de MariaDB hace commit
    // implícito y una ejecución a medias no se puede deshacer con una transacción.
    // Si falla, se corrige con otra migración.
    await conexion.query(sql);
    await conexion.execute("INSERT INTO migracion (nombre) VALUES (?)", [nombre]);
    console.log(`Aplicada ${nombre}`);
  } catch (error: unknown) {
    throw new Error(`Error al aplicar ${nombre}`, { cause: error });
  }
}

async function migrar(): Promise<void> {
  // Validar antes de conectar evita cambios si hay dos archivos con el mismo número.
  const archivos = await leerArchivosMigracion();
  const conexion = await crearConexionScripts();
  try {
    const aplicadas = await leerAplicadas(conexion);
    let cantidadAplicadas = 0;
    for (const nombre of archivos) {
      if (aplicadas.has(nombre)) {
        continue;
      }
      await aplicarMigracion(conexion, nombre);
      cantidadAplicadas += 1;
    }

    if (cantidadAplicadas === 0) {
      console.log("Nada pendiente");
      return;
    }
    console.log(`Migraciones aplicadas: ${cantidadAplicadas}`);
  } finally {
    await conexion.end();
  }
}

void migrar().catch((error: unknown): void => {
  console.error("No se pudieron completar las migraciones:", error);
  process.exitCode = 1;
});
