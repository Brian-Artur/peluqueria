import type { Request, Response, NextFunction } from "express";
import { ErrorNoEncontrado, ErrorConflicto, ErrorNoAutenticado, ErrorProhibido, ErrorDatosInvalidos } from "../errores";

export function manejadorErrores(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response | void {
  if (error instanceof ErrorDatosInvalidos) {
    return res.status(400).json({ error: error.message });
  }

  if (error instanceof ErrorNoAutenticado) {
    return res.status(401).json({ error: error.message });
  }

  if (error instanceof ErrorProhibido) {
    return res.status(403).json({ error: error.message });
  }

  if (error instanceof ErrorNoEncontrado) {
    return res.status(404).json({ error: error.message });
  }

  if (error instanceof ErrorConflicto) {
    return res.status(409).json({ error: error.message });
  }

  if (
    error instanceof SyntaxError &&
    "type" in error && error.type === "entity.parse.failed" &&
    "status" in error && error.status === 400
  ) {
    return res.status(400).json({ error: "JSON mal formado" });
  }

  console.error(error);
  res.status(500).json({ error: "Error interno" });
}
