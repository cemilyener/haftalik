// server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./src/lib/db.js";

import { auth } from "./src/middleware/auth.js";
import authRoutes from "./src/routes/authRoutes.js";

import studentRoutes from "./src/routes/studentsRoutes.js";
import scheduleRoutes from "./src/routes/schedulesRoutes.js";
import lessonRoutes from "./src/routes/lessonsRoutes.js";
import transactionRoutes from "./src/routes/transactionsRoutes.js";
import weeklyRoutes from "./src/routes/weeklyRoutes.js";
import billingRoutes from "./src/routes/billingRoutes.js";
import reportsRoutes from "./src/routes/reportsRoutes.js";
import autoPlanRoutes from "./src/routes/autoPlanRoutes.js";
const app = express();

const ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";
app.use(cors({
  origin: ORIGIN,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204
}));

app.use(express.json());

app.get("/", (_req, res) => res.json({ ok: true, name: "haftalik-api" }));

// ⬇️ Login (korumasız)
app.use("/auth", authRoutes);

// ⬇️ Korunan rotalar (sıraya dikkat)
app.use("/students", auth, studentRoutes);
app.use("/schedules", auth, scheduleRoutes);
app.use("/lessons", auth, lessonRoutes);
app.use("/transactions", auth, transactionRoutes);
app.use("/weekly", auth, weeklyRoutes);
app.use("/billing", auth, billingRoutes);
app.use("/reports", auth, reportsRoutes);
app.use("/auto-plan", autoPlanRoutes);
const PORT = process.env.PORT || 3001;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`✅ API listening on :${PORT}`));
});
