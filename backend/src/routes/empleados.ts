import { Router } from "express";
import { z } from "zod";
import {
  esquemaBaja, esquemaCompetencias, esquemaCrearEmpleado, esquemaDatosEmpleado, esquemaNuevoContrato,
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
