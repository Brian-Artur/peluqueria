import { Router } from "express";
import { z } from "zod";
import {
  listarCitas,
  crearCita,
  moverCita,
  cancelarCita,
} from "../services/citaService";

export const citasRouter = Router();

const crearCitaSchema = z.object({
  cliente_id: z.number().int().positive(),
  servicio_id: z.number().int().positive(),
  inicio: z.string().datetime(),
});

const moverCitaSchema = z.object({
  inicio: z.string().datetime(),
});

function parsearId(valor: string): number | null {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

citasRouter.get("/citas", async (_req, res) => {
  res.json(await listarCitas());
});

citasRouter.post("/citas", async (req, res) => {
  const parsed = crearCitaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.issues });
  }

  const { cliente_id, servicio_id, inicio } = parsed.data;
  const id = await crearCita(cliente_id, servicio_id, inicio);
  res.status(201).json({ id });
});

citasRouter.patch("/citas/:id", async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });

  const parsed = moverCitaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.issues });
  }

  await moverCita(id, parsed.data.inicio);
  res.status(204).send();
});

citasRouter.post("/citas/:id/cancelar", async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });

  await cancelarCita(id);
  res.status(204).send();
});