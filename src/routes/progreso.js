import express from "express";
import supabase from "../config/supabase.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Obtener progreso por conquistador
router.get("/:conquistadorId", authenticate, async (req, res) => {
  const { conquistadorId } = req.params;

  const { data, error } = await supabase
    .from("progreso")
    .select("requisito_id, cumplido")
    .eq("conquistador_id", conquistadorId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Crear o actualizar progreso
router.post("/", authenticate, async (req, res) => {
  const { conquistador_id, requisito_id, cumplido } = req.body;

  if (!conquistador_id || !requisito_id || typeof cumplido !== "boolean") {
    return res.status(400).json({ error: "Faltan datos o son inválidos" });
  }

  const { data, error } = await supabase
    .from("progreso")
    .upsert(
      {
        conquistador_id,
        requisito_id,
        cumplido,
        completed_at: new Date()
      },
      {
        onConflict: "conquistador_id,requisito_id",
        ignoreDuplicates: false
      }
    );

  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true, data });
});

export default router;
