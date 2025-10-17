import express from "express";
import * as lessonsController from "../controllers/lessonsController.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();
router.use(auth);

router.get("/", lessonsController.listLessons);
router.post("/", lessonsController.createLesson);
router.put("/:id/done", lessonsController.markDone);
router.put("/:id/cancel", lessonsController.markCanceled);
router.put("/:id/no-show", lessonsController.markNoShow);
router.put("/:id/revert", lessonsController.revertLesson);
router.delete("/clear-week", lessonsController.clearWeek);
router.delete("/:id", lessonsController.deleteLesson);

export default router;
