import { Router } from "express";
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getBalance,
} from "../controllers/studentsController.js"; // doğru controller + .js

const r = Router();

r.get("/", listStudents);
r.post("/", createStudent);
r.put("/:id", updateStudent);
r.delete("/:id", deleteStudent);
r.get("/:id/balance", getBalance);

export default r;
