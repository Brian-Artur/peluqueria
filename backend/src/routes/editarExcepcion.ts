import { Router } from "express";
import { esquemaDatosExcepcion } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { editarExcepcion } from "../services/editarExcepcion";
import { parsearId } from "./parsearId";

export const editarExcepcionRouter = Router();

editarExcepcionRouter.patch("/excepciones/:id", requierePermiso("local:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaDatosExcepcion.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await editarExcepcion(id, resultado.data);
  res.status(204).send();
});
