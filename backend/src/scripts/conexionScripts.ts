import "dotenv/config";
import mysql, { type Connection } from "mysql2/promise";

export function crearConexionScripts(): Promise<Connection> {
  return mysql.createConnection({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "peluqueria_app",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? "peluqueria",
    // Los archivos SQL pueden contener varias sentencias; el pool de la app no las admite.
    multipleStatements: true,
    // Evita que la zona horaria de la máquina altere los DATETIME guardados en UTC.
    timezone: "Z",
  });
}
