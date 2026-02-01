import express from "express";
import clubRoutes from "./routes/clubRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import conquistadoresRoutes from "./routes/conquistadores.routes.js";
import clasesRoutes from "./routes/clases.js";
import requisitosRoutes from "./routes/requisitos.js";
import progresoRoutes from "./routes/progreso.js";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir frontend
app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/clases", clasesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/conquistadores", conquistadoresRoutes);
app.use("/api/requisitos", requisitosRoutes);
app.use("/api/progreso", progresoRoutes);


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});

export default app;
