import "dotenv/config";
import express from "express";
import { healthRouter } from "./routes/health";
import { serviciosRouter } from "./routes/servicios";
import { categoriasRouter } from "./routes/categorias";
import { clientesRouter } from "./routes/clientes";
import { citasRouter } from "./routes/citas";
import { manejadorErrores } from "./middleware/errores";
import { requiereSesion } from "./middleware/requiereSesion";
import { inicioSesionRouter, sesionRouter } from "./routes/sesion";
import { usuariosRouter } from "./routes/usuarios";
import { empleadosRouter } from "./routes/empleados";

import { tiposRecursoRouter } from "./routes/tiposRecurso";
import { recursosRouter } from "./routes/recursos";
import { obtenerLocalRouter } from "./routes/obtenerLocal";
import { editarLocalRouter } from "./routes/editarLocal";
import { obtenerHorarioRouter } from "./routes/obtenerHorario";
import { obtenerSemanaHorarioRouter } from "./routes/obtenerSemanaHorario";
import { reemplazarHorarioGeneralRouter } from "./routes/reemplazarHorarioGeneral";
import { crearTemporadaRouter } from "./routes/crearTemporada";
import { editarTemporadaRouter } from "./routes/editarTemporada";
import { reemplazarHorarioTemporadaRouter } from "./routes/reemplazarHorarioTemporada";
import { crearExcepcionRouter } from "./routes/crearExcepcion";
import { editarExcepcionRouter } from "./routes/editarExcepcion";
import { eliminarExcepcionRouter } from "./routes/eliminarExcepcion";

const app = express();
// 3100 y no 3000: el 3000 lo usa bot_trading en la misma máquina
const PORT = Number(process.env.PORT ?? 3100);

app.use(express.json());

app.use(healthRouter);                 // /health en raíz: lo llama el healthcheck de Docker
app.use("/api", inicioSesionRouter);
app.use("/api", requiereSesion);
app.use("/api", sesionRouter);
app.use("/api", usuariosRouter);
app.use("/api", empleadosRouter);
app.use("/api", serviciosRouter);
app.use("/api", categoriasRouter);
app.use("/api", tiposRecursoRouter);
app.use("/api", recursosRouter);
app.use("/api", obtenerLocalRouter);
app.use("/api", editarLocalRouter);
app.use("/api", obtenerHorarioRouter);
app.use("/api", obtenerSemanaHorarioRouter);
app.use("/api", reemplazarHorarioGeneralRouter);
app.use("/api", crearTemporadaRouter);
app.use("/api", editarTemporadaRouter);
app.use("/api", reemplazarHorarioTemporadaRouter);
app.use("/api", crearExcepcionRouter);
app.use("/api", editarExcepcionRouter);
app.use("/api", eliminarExcepcionRouter);
app.use("/api", clientesRouter);
app.use("/api", citasRouter);

app.use(manejadorErrores);

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://127.0.0.1:${PORT}`);
});
