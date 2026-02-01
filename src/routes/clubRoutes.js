import express from "express";
import supabase from "../config/supabase.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authenticate, async (req, res) => {
  // 🟢 DISTRITAL → todos los clubes
  if (req.user.rol === "Distrital") {
    const { data, error } = await supabase
      .from("clubs")
      .select("*");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  }

  // 🟢 DIRECTOR → solo su club
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", req.user.club_id);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json(data);
});

export default router;
