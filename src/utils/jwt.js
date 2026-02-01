import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      rol: user.rol,
      club_id: user.club_id
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );
}
