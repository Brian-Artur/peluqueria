import { Router } from "express";
import { esquemaDatosTemporada } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { crearTemporada } from "../services/crearTemporada";

export const crearTemporadaRouter = Router();

crearTemporadaRouter.post("/temporadas", requierePermiso("local:gestionar"), async (req, res) => {
  const resultado = esquemaDatosTemporada.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  const id = await crearTemporada(resultado.data);
  res.status(201).json({ id });
});
