// src/controllers/schedulesController.js
import Schedule from "../models/Schedule.js";

export async function listSchedules(req, res) {
  try {
    const { studentId, active } = req.query;
    const q = {};
    if (studentId) q.studentId = studentId;
    if (active !== undefined) q.active = active === "true";
    const items = await Schedule.find(q).populate("studentId");
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "listSchedules failed" });
  }
}

export async function createSchedule(req, res) {
  try {
    const item = await Schedule.create(req.body);
    res.status(201).json(item);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "createSchedule failed" });
  }
}

export async function updateSchedule(req, res) {
  try {
    const { id } = req.params;
    const item = await Schedule.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: "not found" });
    res.json(item);
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "updateSchedule failed" });
  }
}

export async function deleteSchedule(req, res) {
  try {
    const { id } = req.params;
    const item = await Schedule.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ error: "not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(400).json({ error: "deleteSchedule failed" });
  }
}
