import { Router } from "express";
import { esquemaDatosTemporada } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { editarTemporada } from "../services/editarTemporada";
import { parsearId } from "./parsearId";

export const editarTemporadaRouter = Router();

editarTemporadaRouter.patch("/temporadas/:id", requierePermiso("local:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaDatosTemporada.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await editarTemporada(id, resultado.data);
  res.status(204).send();
});
