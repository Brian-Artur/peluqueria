import { Router } from "express";
import { esquemaCrearCita, esquemaMoverCita } from "@peluqueria/compartido";
import { parsearId } from "./parsearId";
import { requierePermiso } from "../middleware/requierePermiso";
import {
  listarCitas,
  crearCita,
  moverCita,
  cancelarCita,
  completarCita,
} from "../services/citaService";

export const citasRouter = Router();

citasRouter.get("/citas", requierePermiso("citas:ver"), async (_req, res) => {
  res.json(await listarCitas());
});

citasRouter.post("/citas", requierePermiso("citas:gestionar"), async (req, res) => {
  const parsed = esquemaCrearCita.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.issues });
  }

  const { cliente_id, servicio_id, inicio } = parsed.data;
  const id = await crearCita(cliente_id, servicio_id, inicio);
  res.status(201).json({ id });
});

citasRouter.patch("/citas/:id", requierePermiso("citas:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });

  const parsed = esquemaMoverCita.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.issues });
  }

  await moverCita(id, parsed.data.inicio);
  res.status(204).send();
});

citasRouter.post("/citas/:id/cancelar", requierePermiso("citas:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });

  await cancelarCita(id);
  res.status(204).send();
});

citasRouter.post("/citas/:id/completar", requierePermiso("citas:completar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });

  await completarCita(id);
  res.status(204).send();
});
