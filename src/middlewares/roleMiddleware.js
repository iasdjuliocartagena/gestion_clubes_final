export function onlyDistrital(req, res, next) {
  if (req.user.rol !== "Distrital") {
    return res.status(403).json({ error: "Acceso denegado" });
  }
  next();
}
