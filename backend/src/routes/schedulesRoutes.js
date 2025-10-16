import { Router } from "express";
import {
  listSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from "../controllers/schedulesController.js"; // tekil değil çoğul + .js

const r = Router();

r.get("/", listSchedules);
r.post("/", createSchedule);
r.put("/:id", updateSchedule);
r.delete("/:id", deleteSchedule);

export default r;
