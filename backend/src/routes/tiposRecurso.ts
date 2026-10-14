import { Router } from "express";
import { z } from "zod";
import { esquemaDatosTipoRecurso } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { parsearId } from "./parsearId";
import { listarTiposRecurso } from "../services/listarTiposRecurso";
import { crearTipoRecurso } from "../services/crearTipoRecurso";
import { editarTipoRecurso } from "../services/editarTipoRecurso";

export const tiposRecursoRouter = Router();

const esquemaConsulta = z.object({
  incluirInactivos: z.enum(["true", "false"], { error: "incluirInactivos debe ser true o false" })
    .optional().transform((valor) => valor === "true"),
});

tiposRecursoRouter.get("/tipos-recurso", requierePermiso("citas:ver"), async (req, res) => {
  const resultado = esquemaConsulta.safeParse(req.query);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  res.json(await listarTiposRecurso(resultado.data.incluirInactivos));
});

tiposRecursoRouter.post("/tipos-recurso", requierePermiso("local:gestionar"), async (req, res) => {
  const resultado = esquemaDatosTipoRecurso.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  const id = await crearTipoRecurso(resultado.data);
  res.status(201).json({ id });
});

tiposRecursoRouter.patch("/tipos-recurso/:id", requierePermiso("local:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaDatosTipoRecurso.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await editarTipoRecurso(id, resultado.data);
  res.status(204).send();
});
