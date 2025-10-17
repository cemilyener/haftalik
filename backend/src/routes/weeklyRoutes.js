// src/routes/weeklyRoutes.js
import { Router } from "express";
import { getWeekly } from "../controllers/weeklyController.js";

const router = Router();
router.get("/", getWeekly);

export default router;
