// src/routes/schedulesRoutes.js
import { Router } from "express";
import {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/schedulesController.js";

const router = Router();

router.get("/", listSchedules);
router.post("/", createSchedule);
router.put("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

export default router;
