import { Router } from "express";
import { findAllServicios } from "../repositories/servicioRepository";
import { requierePermiso } from "../middleware/requierePermiso";

export const serviciosRouter = Router();

serviciosRouter.get("/servicios", requierePermiso("citas:ver"), async (_req, res) => {
  try {
    const servicios = await findAllServicios();
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener servicios" });
  }
});
