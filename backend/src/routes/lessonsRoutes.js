import { Router } from "express";
import {
  listLessons,
  createLesson,
  updateLesson,
  markDone,
  markCanceled,
  markNoShow,
  createMakeup,
  revertLesson
} from "../controllers/lessonsController.js";

const r = Router();

r.get("/", listLessons);
r.post("/", createLesson);
r.put("/:id", updateLesson);

r.post("/:id/done", markDone);
r.post("/:id/cancel", markCanceled);
r.post("/:id/no-show", markNoShow);
r.post("/:id/makeup", createMakeup);

// ⬇️ yeni: yanlış tıklamayı geri al
r.post("/:id/revert", revertLesson);

export default r;
