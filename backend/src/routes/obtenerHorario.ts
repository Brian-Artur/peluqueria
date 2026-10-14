import { Router } from "express";
import { requierePermiso } from "../middleware/requierePermiso";
import { obtenerHorario } from "../services/obtenerHorario";

export const obtenerHorarioRouter = Router();

obtenerHorarioRouter.get("/horario", requierePermiso("citas:ver"), async (req, res) => {
  res.json(await obtenerHorario());
});
