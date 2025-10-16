import { Router } from "express";
import { autoGenerateWeek } from "../controllers/autoPlanController.js";
import { auth } from "../middleware/auth.js";

const router = Router();
router.post("/generate-week", auth, autoGenerateWeek);
export default router;
