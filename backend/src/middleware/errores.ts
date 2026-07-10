import type { Request, Response, NextFunction } from "express";
import { ErrorNoEncontrado, ErrorConflicto } from "../errores";

export function manejadorErrores(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ErrorNoEncontrado) {
    return res.status(404).json({ error: error.message });
  }

  if (error instanceof ErrorConflicto) {
    return res.status(409).json({ error: error.message });
  }

  console.error(error);
  res.status(500).json({ error: "Error interno" });
}