import { Router } from "express";
import { findAllServicios } from "../repositories/servicioRepository";

export const serviciosRouter = Router();

serviciosRouter.get("/servicios", async (_req, res) => {
  try {
    const servicios = await findAllServicios();
    res.json(servicios);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener servicios" });
  }
});