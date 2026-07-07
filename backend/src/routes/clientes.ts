import { Router } from "express";
import { findAllClientes } from "../repositories/clienteRepository";

export const clientesRouter = Router();

clientesRouter.get("/clientes", async (_req, res) => {
  try {
    const clientes = await findAllClientes();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener clientes" });
  }
});