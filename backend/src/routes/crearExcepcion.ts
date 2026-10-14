import { Router } from "express";
import { esquemaDatosExcepcion } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { crearExcepcion } from "../services/crearExcepcion";

export const crearExcepcionRouter = Router();

crearExcepcionRouter.post("/excepciones", requierePermiso("local:gestionar"), async (req, res) => {
  const resultado = esquemaDatosExcepcion.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  const id = await crearExcepcion(resultado.data);
  res.status(201).json({ id });
});
