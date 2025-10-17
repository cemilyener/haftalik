import { Router } from "express";
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getBalance,
  cleanupOrphanRecords,
  deleteAllTransactions,
  resetDatabase,
  recordPayment // 🆕
} from "../controllers/studentsController.js";

const router = Router();

router.get("/", listStudents);
router.post("/", createStudent);
router.put("/:id", updateStudent);
router.delete("/:id", deleteStudent);
router.get("/:id/balance", getBalance);
router.post("/:id/payment", recordPayment); // 🆕
router.post("/cleanup-orphans", cleanupOrphanRecords);
router.post("/nuke-transactions", deleteAllTransactions);
router.post("/reset-database", resetDatabase);

export default router;
