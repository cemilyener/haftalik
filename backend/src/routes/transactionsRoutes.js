import { Router } from "express";
import { deleteTransaction, listTransactionsByStudent } from "../controllers/transactionsController.js";

const router = Router();

router.get("/", listTransactionsByStudent); // 🆕
router.delete("/:id", deleteTransaction); // 🆕

export default router;
