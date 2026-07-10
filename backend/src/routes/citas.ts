import { Router } from "express";
import { z } from "zod";
import {
  listarCitas,
  crearCita,
  moverCita,
  cancelarCita,
} from "../services/citaService";
import { ErrorNoEncontrado, ErrorConflicto } from "../errores";

export const citasRouter = Router();

const crearCitaSchema = z.object({
  cliente_id: z.number().int().positive(),
  servicio_id: z.number().int().positive(),
  inicio: z.string().datetime(),
});

const moverCitaSchema = z.object({
  inicio: z.string().datetime(),
});

function traducirError(error: unknown, res: any) {
  if (error instanceof ErrorNoEncontrado) {
    return res.status(404).json({ error: error.message });
  }
  if (error instanceof ErrorConflicto) {
    return res.status(409).json({ error: error.message });
  }
  return res.status(500).json({ error: "Error interno" });
}

function parsearId(valor: string): number | null {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

citasRouter.get("/citas", async (_req, res) => {
  try {
    res.json(await listarCitas());
  } catch (error) {
    traducirError(error, res);
  }
});

citasRouter.post("/citas", async (req, res) => {
  const parsed = crearCitaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.issues });
  }

  try {
    const { cliente_id, servicio_id, inicio } = parsed.data;
    const id = await crearCita(cliente_id, servicio_id, inicio);
    res.status(201).json({ id });
  } catch (error) {
    traducirError(error, res);
  }
});

citasRouter.patch("/citas/:id", async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });

  const parsed = moverCitaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.issues });
  }

  try {
    await moverCita(id, parsed.data.inicio);
    res.status(204).send();
  } catch (error) {
    traducirError(error, res);
  }
});

citasRouter.post("/citas/:id/cancelar", async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });

  try {
    await cancelarCita(id);
    res.status(204).send();
  } catch (error) {
    traducirError(error, res);
  }
});