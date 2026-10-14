import { Router } from "express";
import { esquemaHorarioSemanal } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { reemplazarHorarioTemporada } from "../services/reemplazarHorarioTemporada";
import { parsearId } from "./parsearId";

export const reemplazarHorarioTemporadaRouter = Router();

reemplazarHorarioTemporadaRouter.put("/temporadas/:id/horario", requierePermiso("local:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaHorarioSemanal.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await reemplazarHorarioTemporada(id, resultado.data);
  res.status(204).send();
});
