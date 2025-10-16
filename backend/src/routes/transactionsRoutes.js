import { Router } from "express";
import { listTransactions, createTransaction } from "../controllers/transactionsController.js";
const r = Router();
r.get("/", listTransactions);
r.post("/", createTransaction); // payment_iban, payment_cash, prepayment, discount...
export default r;
