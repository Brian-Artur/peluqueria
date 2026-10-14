import { Router } from "express";
import { esquemaLocal } from "@peluqueria/compartido";
import { requierePermiso } from "../middleware/requierePermiso";
import { editarLocal } from "../services/editarLocal";

export const editarLocalRouter = Router();

editarLocalRouter.put("/local", requierePermiso("local:gestionar"), async (req, res) => {
  const resultado = esquemaLocal.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  await editarLocal(resultado.data);
  res.status(204).send();
});
