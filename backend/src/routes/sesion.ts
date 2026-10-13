import { Router } from "express";
import { esquemaCambiarMiContrasena, esquemaCredenciales } from "@peluqueria/compartido";
import { iniciarSesion, cerrarSesion } from "../services/sesionService";
import { leerCookie, crearCookieSesion, caducarCookieSesion } from "../seguridad/cookies";
import { requierePermiso } from "../middleware/requierePermiso";
import { cambiarMiContrasena } from "../services/cambiarMiContrasena";

// Solo el POST se monta antes de requiereSesion en index.ts.
export const inicioSesionRouter = Router();
export const sesionRouter = Router();

inicioSesionRouter.post("/sesion", async (req, res) => {
  const resultado = esquemaCredenciales.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }

  const sesion = await iniciarSesion(resultado.data);
  res.setHeader("Set-Cookie", crearCookieSesion(sesion.token));
  res.status(200).json(sesion.usuario);
});

sesionRouter.get("/sesion", (_req, res) => {
  res.json(res.locals.usuario);
});

sesionRouter.delete("/sesion", async (req, res) => {
  const token = leerCookie(req.headers.cookie, "sesion")!;
  await cerrarSesion(token);
  res.setHeader("Set-Cookie", caducarCookieSesion());
  res.status(204).send();
});

sesionRouter.put("/sesion/contrasena", requierePermiso("sesion:contrasena"), async (req, res) => {
  const resultado = esquemaCambiarMiContrasena.safeParse(req.body);
  if (!resultado.success) {
    return res.status(400).json({ error: "Datos inválidos", detalles: resultado.error.issues });
  }
  const token = leerCookie(req.headers.cookie, "sesion")!;
  await cambiarMiContrasena(res.locals.usuario!.id, token, resultado.data);
  res.status(204).send();
});
