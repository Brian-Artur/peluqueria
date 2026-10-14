import { Router } from "express";
import { z } from "zod";
import { esquemaDatosRecurso } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { parsearId } from "./parsearId";
import { listarRecursos } from "../services/listarRecursos";
import { crearRecurso } from "../services/crearRecurso";
import { editarRecurso } from "../services/editarRecurso";

export const recursosRouter = Router();

const esquemaConsulta = z.object({
  incluirInactivos: z.enum(["true", "false"], { error: "incluirInactivos debe ser true o false" })
    .optional().transform((valor) => valor === "true"),
});

recursosRouter.get("/recursos", requierePermiso("citas:ver"), async (req, res) => {
  const resultado = esquemaConsulta.safeParse(req.query);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  res.json(await listarRecursos(resultado.data.incluirInactivos));
});

recursosRouter.post("/recursos", requierePermiso("local:gestionar"), async (req, res) => {
  const resultado = esquemaDatosRecurso.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  const id = await crearRecurso(resultado.data);
  res.status(201).json({ id });
});

recursosRouter.patch("/recursos/:id", requierePermiso("local:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaDatosRecurso.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await editarRecurso(id, resultado.data);
  res.status(204).send();
});
