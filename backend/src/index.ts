import "dotenv/config";
import express from "express";
import { healthRouter } from "./routes/health";
import { serviciosRouter } from "./routes/servicios";
import { clientesRouter } from "./routes/clientes";
import { citasRouter } from "./routes/citas";
import { manejadorErrores } from "./middleware/errores";
import { requiereSesion } from "./middleware/requiereSesion";
import { inicioSesionRouter, sesionRouter } from "./routes/sesion";
import { usuariosRouter } from "./routes/usuarios";

const app = express();
// 3100 y no 3000: el 3000 lo usa bot_trading en la misma máquina
const PORT = Number(process.env.PORT ?? 3100);

app.use(express.json());

app.use(healthRouter);                 // /health en raíz: lo llama el healthcheck de Docker
app.use("/api", inicioSesionRouter);
app.use("/api", requiereSesion);
app.use("/api", sesionRouter);
app.use("/api", usuariosRouter);
app.use("/api", serviciosRouter);
app.use("/api", clientesRouter);
app.use("/api", citasRouter);

app.use(manejadorErrores);

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://127.0.0.1:${PORT}`);
});
