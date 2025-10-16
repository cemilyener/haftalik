import { Router } from "express";
import { getWeekly } from "../controllers/weeklyController.js";
const r = Router();
r.get("/", getWeekly); // /weekly?start=2025-10-13
export default r;
