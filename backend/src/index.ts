import "dotenv/config";
import express from "express";
import { healthRouter } from "./routes/health";

const app = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(express.json());
app.use(healthRouter);

app.listen(PORT, () => {
  console.log(`Backend escuchando en http://localhost:${PORT}`);
});
