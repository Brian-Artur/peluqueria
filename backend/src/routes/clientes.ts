import { Router } from "express";
import { z } from "zod";
import { esquemaDatosCliente } from "@peluqueria/compartido";
import { listarClientes, obtenerCliente, crearCliente, editarCliente } from "../services/clienteService";
import { parsearId } from "./parsearId";

const esquemaBusqueda = z.object({
  buscar: z.string({ error: "La búsqueda debe ser un texto" })
    .trim()
    .max(100, "La búsqueda no puede superar los 100 caracteres")
    .optional()
    .default(""),
});

export const clientesRouter = Router();

clientesRouter.get("/clientes", async (req, res) => {
  const resultado = esquemaBusqueda.safeParse(req.query);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  res.json(await listarClientes(resultado.data.buscar));
});

clientesRouter.get("/clientes/:id", async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });

  res.json(await obtenerCliente(id));
});

clientesRouter.post("/clientes", async (req, res) => {
  const resultado = esquemaDatosCliente.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }

  const id = await crearCliente(resultado.data);
  res.status(201).json({ id });
});

clientesRouter.patch("/clientes/:id", async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });

  const resultado = esquemaDatosCliente.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }

  await editarCliente(id, resultado.data);
  res.status(204).send();
});
