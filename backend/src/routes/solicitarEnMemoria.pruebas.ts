import type { Request, Response, Router } from "express";
import type { Rol } from "@peluqueria/compartido";
import { manejadorErrores } from "../middleware/errores";

type Respuesta = { codigo: number; cuerpo: unknown };

// Ejecuta router y permisos reales sin abrir puertos ni cargar la BD.
export function solicitarEnMemoria(
  router: Router, metodo: string, url: string, cuerpo?: unknown, rol?: Rol,
): Promise<Respuesta> {
  return new Promise((resolve, reject) => {
    let codigo = 200;
    const parametros = new URL(url, "http://127.0.0.1").searchParams;
    const consulta: Record<string, string | string[]> = {};
    for (const clave of new Set(parametros.keys())) {
      const valores = parametros.getAll(clave);
      consulta[clave] = valores.length === 1 ? valores[0] : valores;
    }
    const req = { method: metodo, url, body: cuerpo, query: consulta } as Request;
    const res = {
      locals: { usuario: rol ? { id: 7, rol } : undefined },
      status: (valor: number): Response => { codigo = valor; return res; },
      json: (datos: unknown): Response => { resolve({ codigo, cuerpo: datos }); return res; },
      send: (): Response => { resolve({ codigo, cuerpo: undefined }); return res; },
    } as unknown as Response;
    router(req, res, (error?: unknown) => {
      if (!error) { reject(new Error(`Ruta no encontrada: ${metodo} ${url}`)); return; }
      manejadorErrores(error, req, res, reject);
    });
  });
}
