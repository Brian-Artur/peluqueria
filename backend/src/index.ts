import "dotenv/config";
import express from "express";
import { healthRouter } from "./routes/health";
import { serviciosRouter } from "./routes/servicios";
import { clientesRouter } from "./routes/clientes";
import { citasRouter } from "./routes/citas";
import { manejadorErrores } from "./middleware/errores";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.use(healthRouter);                 // /health en raíz: lo llama el healthcheck de Docker
app.use("/api", serviciosRouter);
app.use("/api", clientesRouter);
app.use("/api", citasRouter);

app.use(manejadorErrores);

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
