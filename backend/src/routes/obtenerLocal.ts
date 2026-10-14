import { Router } from "express";
import { requierePermiso } from "../middleware/requierePermiso";
import { obtenerLocal } from "../services/obtenerLocal";

export const obtenerLocalRouter = Router();

obtenerLocalRouter.get("/local", requierePermiso("citas:ver"), async (req, res) => {
  res.json(await obtenerLocal());
});
