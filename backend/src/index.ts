import "dotenv/config";
import express from "express";
import { healthRouter } from "./routes/health";
import { serviciosRouter } from "./routes/servicios";
import { clientesRouter } from "./routes/clientes";
import { citasRouter } from "./routes/citas";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(healthRouter);
app.use(serviciosRouter);
app.use(clientesRouter);
app.use(citasRouter);

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
