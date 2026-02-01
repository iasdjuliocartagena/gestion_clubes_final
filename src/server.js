import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en el puerto: ${PORT}`);
  console.log(`📁 Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Accede en: http://localhost:${PORT}`);
  
  // Mostrar rutas disponibles
  console.log("\n📋 Rutas disponibles:");
  console.log("  - /login (frontend)");
  console.log("  - /dashboard-* (frontend)");
  console.log("  - /clase (frontend)");
  console.log("  - /api/* (backend API)");
});