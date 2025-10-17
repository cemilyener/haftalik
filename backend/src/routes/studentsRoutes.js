import { Router } from "express";
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getBalance,
  cleanupOrphanRecords // 🆕
} from "../controllers/studentsController.js";

const router = Router();

router.get("/", listStudents);
router.post("/", createStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);
router.get("/:id/balance", getBalance);
router.post("/cleanup-orphans", cleanupOrphanRecords); // 🆕

export default router;
