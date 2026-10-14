import { Router } from "express";
import { esquemaHorarioSemanal } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { reemplazarHorarioGeneral } from "../services/reemplazarHorarioGeneral";

export const reemplazarHorarioGeneralRouter = Router();

reemplazarHorarioGeneralRouter.put("/horario/general", requierePermiso("local:gestionar"), async (req, res) => {
  const resultado = esquemaHorarioSemanal.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await reemplazarHorarioGeneral(resultado.data);
  res.status(204).send();
});
