import type { Request, Response, NextFunction } from "express";
import type { UsuarioSesion } from "@peluqueria/compartido";
import { ErrorNoAutenticado } from "../errores";
import { leerCookie } from "../seguridad/cookies";
import { obtenerUsuarioSesion } from "../services/sesionService";

declare global {
  namespace Express {
    interface Locals {
      usuario?: UsuarioSesion;
    }
  }
}

export async function requiereSesion(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = leerCookie(req.headers.cookie, "sesion");
  if (!token) throw new ErrorNoAutenticado();

  const usuario = await obtenerUsuarioSesion(token);
  if (!usuario) throw new ErrorNoAutenticado();

  res.locals.usuario = usuario;
  next();
}
