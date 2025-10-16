import { Router } from "express";
import { monthlySummary } from "../controllers/reportsController.js";

const r = Router();
r.get("/monthly", monthlySummary);

export default r;
