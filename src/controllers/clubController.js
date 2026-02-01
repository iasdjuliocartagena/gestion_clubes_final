import express from "express";
import supabase from "../config/supabase.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

/**
 * 🔹 GET /api/clubs
 * Distrital → todos los clubes
 * Director → solo su club
 */
router.get("/", authenticate, async (req, res) => {
  try {
    // 🟢 DISTRITAL
    if (req.user.rol === "Distrital") {
      const { data, error } = await supabase
        .from("clubs")
        .select("*");

      if (error) throw error;

      return res.json(data);
    }

    // 🟢 DIRECTOR → solo su club
    const { data, error } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", req.user.club_id)
      .single();

    if (error) throw error;

    return res.json([data]); // array para mantener consistencia
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * 🔹 GET /api/clubs/:id
 * Obtener un club por ID
 */
router.get("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // 🔐 Seguridad: director solo puede ver su club
    if (req.user.rol === "Director" && req.user.club_id !== id) {
      return res.status(403).json({ error: "Acceso denegado" });
    }

    const { data, error } = await supabase
      .from("clubs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Club no encontrado" });
    }

    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
