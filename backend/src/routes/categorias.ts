import { Router } from "express";
import { esquemaDatosCategoria } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { parsearId } from "./parsearId";
import { listarCategorias } from "../services/listarCategorias";
import { crearCategoria } from "../services/crearCategoria";
import { editarCategoria } from "../services/editarCategoria";

export const categoriasRouter = Router();

categoriasRouter.get("/categorias", requierePermiso("citas:ver"), async (_req, res) => {
  res.json(await listarCategorias());
});

categoriasRouter.post("/categorias", requierePermiso("servicios:gestionar"), async (req, res) => {
  const resultado = esquemaDatosCategoria.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  const id = await crearCategoria(resultado.data);
  res.status(201).json({ id });
});

categoriasRouter.patch("/categorias/:id", requierePermiso("servicios:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaDatosCategoria.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await editarCategoria(id, resultado.data);
  res.status(204).send();
});
