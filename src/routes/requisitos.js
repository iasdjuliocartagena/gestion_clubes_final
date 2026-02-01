import express from "express";
import supabase from "../config/supabase.js";

const router = express.Router();

// Requisitos por clase
router.get("/:claseId", async (req, res) => {
  const { claseId } = req.params;

  const { data, error } = await supabase
    .from("requisitos")
    .select("id, titulo, categoria, tipo, orden")
    .eq("clase_id", claseId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;
