import { Router } from "express";
import { esquemaCrearUsuario, esquemaEditarUsuario, esquemaContrasenaNueva } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { listarUsuarios, obtenerUsuario, crearUsuario, editarUsuario, ponerContrasenaNueva } from "../services/usuarioService";
import { parsearId } from "./parsearId";

export const usuariosRouter = Router();

usuariosRouter.get("/usuarios", requierePermiso("usuarios:gestionar"), async (_req, res) => {
  res.json(await listarUsuarios());
});

usuariosRouter.get("/usuarios/:id", requierePermiso("usuarios:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  res.json(await obtenerUsuario(id));
});

usuariosRouter.post("/usuarios", requierePermiso("usuarios:gestionar"), async (req, res) => {
  const resultado = esquemaCrearUsuario.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  const id = await crearUsuario(resultado.data);
  res.status(201).json({ id });
});

usuariosRouter.patch("/usuarios/:id", requierePermiso("usuarios:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaEditarUsuario.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await editarUsuario(id, resultado.data, res.locals.usuario!.id);
  res.status(204).send();
});

usuariosRouter.put("/usuarios/:id/contrasena", requierePermiso("usuarios:gestionar"), async (req, res) => {
  const id = parsearId(req.params.id);
  if (!id) return res.status(400).json({ error: "Id inválido" });
  const resultado = esquemaContrasenaNueva.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await ponerContrasenaNueva(id, resultado.data.contrasena);
  res.status(204).send();
});
