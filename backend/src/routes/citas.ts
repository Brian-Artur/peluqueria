import { Router } from "express";
import { findAllCitas } from "../repositories/citaRepository";

export const citasRouter = Router();

citasRouter.get("/citas", async (_req, res) => {
  try {
    const citas = await findAllCitas();
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener citas" });
  }
});