import { Router } from "express";
import { requierePermiso } from "../middleware/requierePermiso";
import { eliminarExcepcion } from "../services/eliminarExcepcion";
import { parsearId } from "./parsearId";

export const eliminarExcepcionRouter = Router();

eliminarExcepcionRouter.delete("/excepciones/:id", requierePermiso("local:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  await eliminarExcepcion(id);
  res.status(204).send();
});
