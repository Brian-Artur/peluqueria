import { Router } from "express";
import { z } from "zod";
import { esquemaDatosServicio } from "@peluqueria/compartido";
import { listarServicios } from "../services/listarServicios";
import { obtenerServicio } from "../services/obtenerServicio";
import { crearServicio } from "../services/crearServicio";
import { editarServicio } from "../services/editarServicio";
import { parsearId } from "./parsearId";
import { requierePermiso } from "../middleware/requierePermiso";

export const serviciosRouter = Router();

const esquemaConsulta = z.object({
  incluirInactivos: z.enum(["true", "false"], { error: "incluirInactivos debe ser true o false" })
    .optional().transform((valor) => valor === "true"),
});

serviciosRouter.get("/servicios", requierePermiso("citas:ver"), async (req, res) => {
  const resultado = esquemaConsulta.safeParse(req.query);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  res.json(await listarServicios(resultado.data.incluirInactivos));
});

serviciosRouter.get("/servicios/:id", requierePermiso("citas:ver"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  res.json(await obtenerServicio(id));
});

serviciosRouter.post("/servicios", requierePermiso("servicios:gestionar"), async (req, res) => {
  const resultado = esquemaDatosServicio.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  const id = await crearServicio(resultado.data);
  res.status(201).json({ id });
});

serviciosRouter.patch("/servicios/:id", requierePermiso("servicios:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaDatosServicio.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await editarServicio(id, resultado.data);
  res.status(204).send();
});
