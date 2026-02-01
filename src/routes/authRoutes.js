import express from "express";
import supabase from "../config/supabase.js";
import { generateToken } from "../utils/jwt.js";

const router = express.Router();

/**
 * LOGIN
 */
router.post("/login", async (req, res) => {
  const { user, password } = req.body;

  // 1. Validar datos
  if (!user || !password) {
    return res.status(400).json({
      error: "Usuario y contraseña son obligatorios"
    });
  }

  // 2. Buscar usuario
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("user", user)
    .single();

  if (error || !data) {
    return res.status(404).json({
      error: "Usuario no encontrado"
    });
  }

  // 3. Comparar contraseña (texto plano por ahora)
  if (data.password !== password) {
    return res.status(401).json({
      error: "Contraseña incorrecta"
    });
  }

  // 4. Generar token
  const token = generateToken(data);

  // 5. Respuesta
  return res.json({
    message: "Login exitoso 🟢",
    token,
    user: {
      id: data.id,
      nombre: data.nombre,
      rol: data.rol,
      club_id: data.club_id
    }
  });
}); // 👈 ESTA LÍNEA FALTABA

export default router;
