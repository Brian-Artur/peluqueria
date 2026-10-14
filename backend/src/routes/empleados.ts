import { Router } from "express";
import { z } from "zod";
import {
  esquemaBaja, esquemaCompetencias, esquemaCrearEmpleado, esquemaDatosEmpleado, esquemaNuevoContrato, esquemaDatosTiempo,
} from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { listarEmpleados } from "../services/listarEmpleados";
import { obtenerEmpleado } from "../services/obtenerEmpleado";
import { crearEmpleado } from "../services/crearEmpleado";
import { editarEmpleado } from "../services/editarEmpleado";
import { nuevoContratoEmpleado } from "../services/nuevoContratoEmpleado";
import { darBajaEmpleado } from "../services/darBajaEmpleado";
import { reemplazarCompetencias } from "../services/reemplazarCompetencias";
import { listarCompetencias } from "../services/listarCompetencias";
import { parsearId } from "./parsearId";
import { listarTiemposEmpleado } from "../services/listarTiemposEmpleado";
import { listarHistorialTiempo } from "../services/listarHistorialTiempo";
import { editarTiempoEmpleado } from "../services/editarTiempoEmpleado";

export const empleadosRouter = Router();

const esquemaConsulta = z.object({
  incluirInactivos: z.enum(["true", "false"], { error: "incluirInactivos debe ser true o false" })
    .optional().transform((valor) => valor === "true"),
});

empleadosRouter.get("/empleados", requierePermiso("empleados:ver"), async (req, res) => {
  const resultado = esquemaConsulta.safeParse(req.query);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  res.json(await listarEmpleados(resultado.data.incluirInactivos));
});

empleadosRouter.get("/empleados/:id", requierePermiso("empleados:ver"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  res.json(await obtenerEmpleado(id));
});

empleadosRouter.post("/empleados", requierePermiso("empleados:gestionar"), async (req, res) => {
  const resultado = esquemaCrearEmpleado.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  const id = await crearEmpleado(resultado.data);
  res.status(201).json({ id });
});

empleadosRouter.patch("/empleados/:id", requierePermiso("empleados:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaDatosEmpleado.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await editarEmpleado(id, resultado.data);
  res.status(204).send();
});

empleadosRouter.post("/empleados/:id/contratos", requierePermiso("empleados:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaNuevoContrato.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  const contratoId = await nuevoContratoEmpleado(id, resultado.data);
  res.status(201).json({ id: contratoId });
});

empleadosRouter.post("/empleados/:id/baja", requierePermiso("empleados:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaBaja.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await darBajaEmpleado(id, resultado.data);
  res.status(204).send();
});

empleadosRouter.put("/empleados/:id/competencias", requierePermiso("empleados:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaCompetencias.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await reemplazarCompetencias(id, resultado.data);
  res.status(204).send();
});

empleadosRouter.get("/competencias", requierePermiso("empleados:ver"), async (_req, res) => {
  res.json(await listarCompetencias());
});

empleadosRouter.get("/empleados/:id/tiempos", requierePermiso("rendimiento:ver"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  res.json(await listarTiemposEmpleado(id));
});

empleadosRouter.get("/empleados/:id/tiempos/historial", requierePermiso("rendimiento:ver"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  res.json(await listarHistorialTiempo(id));
});

empleadosRouter.put("/empleados/:id/tiempos/:servicioId", requierePermiso("rendimiento:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  const servicioId = parsearId(req.params.servicioId);
  if (!id || !servicioId) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaDatosTiempo.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await editarTiempoEmpleado(id, servicioId, resultado.data, res.locals.usuario!.id);
  res.status(204).send();
});
