import { Router } from "express";
import { runDailyBilling } from "../controllers/billingController.js";
const r = Router();
r.post("/run-daily", runDailyBilling);
export default r;
