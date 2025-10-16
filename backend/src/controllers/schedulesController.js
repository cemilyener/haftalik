import mongoose from "mongoose";
import Schedule from "../models/Schedule.js";

export async function listSchedules(_req, res) {
  try {
    const docs = await Schedule.find().populate("studentId").lean();
    res.json(docs);
  } catch (err) {
    console.error("listSchedules error:", err);
    res.status(500).json({ error: "Failed to list schedules" });
  }
}

export async function createSchedule(req, res) {
  try {
    const { studentId, weekday, time, durationMin = 40, location = "home", active = true } = req.body || {};
    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ error: "valid studentId is required" });
    }
    if (!weekday || !time) {
      return res.status(400).json({ error: "weekday and time are required" });
    }
    const doc = await Schedule.create({ studentId, weekday, time, durationMin, location, active });
    res.status(201).json(doc);
  } catch (err) {
    console.error("createSchedule error:", err);
    res.status(500).json({ error: "Failed to create schedule" });
  }
}

export async function updateSchedule(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "invalid id" });

    const doc = await Schedule.findByIdAndUpdate(id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: "schedule not found" });

    res.json(doc);
  } catch (err) {
    console.error("updateSchedule error:", err);
    res.status(500).json({ error: "Failed to update schedule" });
  }
}

export async function deleteSchedule(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "invalid id" });

    await Schedule.findByIdAndDelete(id);
    res.status(204).end();
  } catch (err) {
    console.error("deleteSchedule error:", err);
    res.status(500).json({ error: "Failed to delete schedule" });
  }
}
