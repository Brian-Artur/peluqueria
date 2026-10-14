import { Router } from "express";
import { z } from "zod";
import { esquemaFechaHorario } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { obtenerSemanaHorario } from "../services/obtenerSemanaHorario";

export const obtenerSemanaHorarioRouter = Router();

const esquemaConsulta = z.object({ desde: esquemaFechaHorario });

obtenerSemanaHorarioRouter.get("/horario/semana", requierePermiso("citas:ver"), async (req, res) => {
  const resultado = esquemaConsulta.safeParse(req.query);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  res.json(await obtenerSemanaHorario(resultado.data.desde));
});
