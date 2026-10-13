import type { RequestHandler } from "express";
import { puede, type Permiso } from "@peluqueria/compartido";
import { ErrorNoAutenticado, ErrorProhibido } from "../errores";

export function requierePermiso(permiso: Permiso): RequestHandler {
  return (_req, res, next): void => {
    const usuario = res.locals.usuario;
    if (!usuario) throw new ErrorNoAutenticado();
    if (!puede(usuario.rol, permiso)) throw new ErrorProhibido();
    next();
  };
}
