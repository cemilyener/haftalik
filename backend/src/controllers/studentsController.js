// backend/src/controllers/studentsController.js
import mongoose from "mongoose";
import Student from "../models/Student.js";
import Transaction from "../models/Transaction.js";

/**
 * GET /students
 * ?q=aranan&limit=50&skip=0
 */
export async function listStudents(req, res) {
  try {
    const { q, limit = 100, skip = 0 } = req.query;
    const find = q
      ? { name: { $regex: new RegExp(q, "i") } }
      : {};
    const docs = await Student.find(find)
      .sort({ name: 1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();
    res.json(docs);
  } catch (err) {
    console.error("listStudents error:", err);
    res.status(500).json({ error: "Failed to list students" });
  }
}

/**
 * POST /students
 * Body: { name, rateModel, lessonFee, ... }
 */
export async function createStudent(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.name) return res.status(400).json({ error: "name is required" });
    if (!payload.rateModel) return res.status(400).json({ error: "rateModel is required" });

    const doc = await Student.create(payload);
    res.status(201).json(doc);
  } catch (err) {
    console.error("createStudent error:", err);
    res.status(500).json({ error: "Failed to create student" });
  }
}

/**
 * PUT /students/:id
 */
export async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "invalid id" });

    const doc = await Student.findByIdAndUpdate(id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: "student not found" });

    res.json(doc);
  } catch (err) {
    console.error("updateStudent error:", err);
    res.status(500).json({ error: "Failed to update student" });
  }
}

/**
 * DELETE /students/:id
 */
export async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "invalid id" });

    await Student.findByIdAndDelete(id);
    res.status(204).end();
  } catch (err) {
    console.error("deleteStudent error:", err);
    res.status(500).json({ error: "Failed to delete student" });
  }
}

/**
 * GET /students/:id/balance
 * Ledger mantığı: SUM(transactions.amount)
 *  > 0  => sende para/avans
 *  < 0  => veliden alacak
 */
export async function getBalance(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "invalid id" });

    const studentObjectId = new mongoose.Types.ObjectId(id);
    const agg = await Transaction.aggregate([
      { $match: { studentId: studentObjectId } },
      { $group: { _id: "$studentId", balance: { $sum: "$amount" } } }
    ]);

    res.json({ balance: agg[0]?.balance ?? 0 });
  } catch (err) {
    console.error("getBalance error:", err);
    res.status(500).json({ error: "Failed to get balance" });
  }
}
