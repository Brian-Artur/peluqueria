import { Router } from "express";
import { z } from "zod";
import {
  findAllCitas,
  createCita,
  findCitaById,
  updateInicioFin,
  updateEstado,
} from "../repositories/citaRepository";
import { findServicioById } from "../repositories/servicioRepository";
import { findClienteById } from "../repositories/clienteRepository";

export const citasRouter = Router();

const crearCitaSchema = z.object({
  cliente_id: z.number().int().positive(),
  servicio_id: z.number().int().positive(),
  inicio: z.string().datetime(),
});

const moverCitaSchema = z.object({
  inicio: z.string().datetime(),
});

citasRouter.get("/citas", async (_req, res) => {
  try {
    const citas = await findAllCitas();
    res.json(citas);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener citas" });
  }
});

citasRouter.post("/citas", async (req, res) => {
  const parsed = crearCitaSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.issues });
  }

  const { cliente_id, servicio_id, inicio } = parsed.data;

  try {
    const cliente = await findClienteById(cliente_id);
    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const servicio = await findServicioById(servicio_id);
    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fechaInicio.getTime() + servicio.duracion_min * 60_000);

    const id = await createCita(cliente_id, servicio_id, fechaInicio, fechaFin);

    res.status(201).json({ id });
  } catch (error) {
    res.status(500).json({ error: "Error al crear la cita" });
  }
});

// Mover: cambia inicio, recalcula fin desde la duración del servicio
citasRouter.patch("/citas/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Id inválido" });
  }

  const parsed = moverCitaSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: parsed.error.issues });
  }

  try {
    const cita = await findCitaById(id);
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    if (cita.estado !== "reservada") {
      return res.status(409).json({ error: "Solo se pueden mover citas reservadas" });
    }

    const servicio = await findServicioById(cita.servicio_id);
    if (!servicio) {
      return res.status(404).json({ error: "Servicio no encontrado" });
    }

    const fechaInicio = new Date(parsed.data.inicio);
    const fechaFin = new Date(fechaInicio.getTime() + servicio.duracion_min * 60_000);

    await updateInicioFin(id, fechaInicio, fechaFin);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Error al mover la cita" });
  }
});

// Cancelar: transición de estado reservada → cancelada
citasRouter.post("/citas/:id/cancelar", async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Id inválido" });
  }

  try {
    const cita = await findCitaById(id);
    if (!cita) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    if (cita.estado !== "reservada") {
      return res.status(409).json({ error: "Solo se pueden cancelar citas reservadas" });
    }

    await updateEstado(id, "cancelada");
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Error al cancelar la cita" });
  }
});