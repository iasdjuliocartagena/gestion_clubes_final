import express from "express";
import supabase from "../config/supabase.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 📄 Listar conquistadores por club y clase
router.get("/clase/:clase", authenticate, async (req, res) => {
  const { clase } = req.params;
  const { club_id } = req.query;

  let clubIdFinal = req.user.club_id;

  // 🔵 Si es distrital, debe venir club_id por query
  if (req.user.rol === "Distrital") {
    if (!club_id) {
      return res.status(400).json({ error: "club_id requerido para distrital" });
    }
    clubIdFinal = club_id;
  }

  const { data, error } = await supabase
    .from("conquistadores")
    .select("id, nombre")
    .eq("club_id", clubIdFinal)
    .eq("clase", clase)
    .order("nombre");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});


// ➕ Crear conquistador
router.post("/", authenticate, async (req, res) => {
  const { nombre, clase } = req.body;

  const { data, error } = await supabase
    .from("conquistadores")
    .insert([{
      nombre,
      clase,
      club_id: req.user.club_id
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ✏️ Editar conquistador
router.put("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { nombre } = req.body;

  const { error } = await supabase
    .from("conquistadores")
    .update({ nombre })
    .eq("id", id)
    .eq("club_id", req.user.club_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// 🗑️ Eliminar conquistador
router.delete("/:id", authenticate, async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from("conquistadores")
    .delete()
    .eq("id", id)
    .eq("club_id", req.user.club_id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

export default router;
