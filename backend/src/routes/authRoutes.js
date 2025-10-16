// src/routes/authRoutes.js
import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "12h" });
    return res.json({ token });
  }
  res.status(401).json({ error: "Geçersiz giriş bilgileri" });
});

export default router;
