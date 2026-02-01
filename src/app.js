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
import fs from 'fs';

const app = express();

// Para evitar que Render mate tu app por inactividad
app.use('/health', (req, res) => {
  res.status(200).send('OK');
});

// Opcional: Ping automático cada 5 minutos
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    fetch(`https://gestion-clubes.onrender.com/health`)
      .catch(err => console.log('Ping automático'));
  }, 5 * 60 * 1000);
}

// Configurar CORS
app.use(cors());

app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📌 **RUTA CORRECTA PARA PUBLIC**: subir un nivel desde src/
const publicPath = path.join(__dirname, '../public');
console.log(`Buscando public en: ${publicPath}`);

if (fs.existsSync(publicPath)) {
  console.log('✓ Carpeta public encontrada');
  app.use(express.static(publicPath));
} else {
  console.log('✗ Carpeta public NO encontrada, usando raíz del proyecto');
  app.use(express.static(process.cwd()));
}

// Rutas API
app.use("/api/clases", clasesRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/conquistadores", conquistadoresRoutes);
app.use("/api/requisitos", requisitosRoutes);
app.use("/api/progreso", progresoRoutes);

// Rutas para HTML
app.get(["/", "/login"], (req, res) => {
  res.sendFile(path.join(publicPath, 'login.html'));
});

app.get("/dashboard-*", (req, res) => {
  const fileName = req.path.substring(1) + '.html';
  res.sendFile(path.join(publicPath, fileName));
});

app.get("/clase", (req, res) => {
  res.sendFile(path.join(publicPath, 'clase.html'));
});

// Para cualquier otra ruta, intentar servir archivo estático o redirigir
app.get("*", (req, res) => {
  const filePath = path.join(publicPath, req.path);
  
  if (fs.existsSync(filePath) && !req.path.includes('..')) {
    res.sendFile(filePath);
  } else {
    // Si no existe, redirigir a login
    res.redirect('/login');
  }
});

export default app;