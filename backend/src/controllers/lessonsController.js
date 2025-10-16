import mongoose from "mongoose";
import Lesson from "../models/Lesson.js";
import Student from "../models/Student.js";
import Transaction from "../models/Transaction.js";
import { calcLessonAccrual } from "../utils/accrual.js";

export async function listLessons(req, res) {
  try {
    const q = {};
    if (req.query.from || req.query.to) {
      q.startAt = {};
      if (req.query.from) q.startAt.$gte = new Date(req.query.from);
      if (req.query.to) q.startAt.$lt = new Date(req.query.to);
    }
    const docs = await Lesson.find(q).populate("studentId");
    res.json(docs);
  } catch (err) {
    console.error("listLessons error:", err);
    res.status(500).json({ error: "Failed to list lessons" });
  }
}

export async function createLesson(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.studentId || !mongoose.isValidObjectId(payload.studentId)) {
      return res.status(400).json({ error: "valid studentId is required" });
    }
    if (!payload.startAt) return res.status(400).json({ error: "startAt is required" });

    const doc = await Lesson.create({
      studentId: payload.studentId,
      startAt: new Date(payload.startAt),
      durationMin: payload.durationMin ?? 40,
      location: payload.location ?? "home",
      status: payload.status ?? "planned",
      topic: payload.topic,
      homeworkGiven: payload.homeworkGiven,
      homeworkDue: payload.homeworkDue,
      notes: payload.notes,
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error("createLesson error:", err);
    res.status(500).json({ error: "Failed to create lesson" });
  }
}

export async function updateLesson(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "invalid id" });

    const doc = await Lesson.findByIdAndUpdate(id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: "lesson not found" });
    res.json(doc);
  } catch (err) {
    console.error("updateLesson error:", err);
    res.status(500).json({ error: "Failed to update lesson" });
  }
}

async function setStatus(req, res, status) {
  try {
    const { id } = req.params;
    const les = await Lesson.findById(id).populate("studentId");
    if (!les) return res.status(404).json({ error: "lesson not found" });

    les.status = status;
    await les.save();

    if (status === "done") {
      const s = les.studentId;
      const amount = calcLessonAccrual({
        rateModel: s.rateModel,
        lessonFee: s.lessonFee,
        hourFee: s.hourFee,
        durationMin: les.durationMin,
      });
      if (amount !== 0) {
        await Transaction.create({
          studentId: s._id,
          date: new Date(),
          type: "lesson_accrual",
          amount,
          linkedLessonId: les._id,
          note: "Auto accrual",
        });
        les.accrualAmount = amount;
        await les.save();
      }
      return res.json({ ok: true, status: les.status, accrual: les.accrualAmount ?? 0 });
    }

    return res.json({ ok: true, status: les.status });
  } catch (err) {
    console.error("setStatus error:", err);
    res.status(500).json({ error: "Failed to update status" });
  }
}

export const markDone = (req, res) => setStatus(req, res, "done");
export const markCanceled = (req, res) => setStatus(req, res, "canceled");
export const markNoShow = (req, res) => setStatus(req, res, "no_show");

export async function createMakeup(req, res) {
  try {
    const base = await Lesson.findById(req.params.id);
    if (!base) return res.status(404).json({ error: "lesson not found" });

    const doc = await Lesson.create({
      studentId: base.studentId,
      startAt: new Date(req.body.startAt),
      durationMin: req.body.durationMin ?? base.durationMin,
      location: req.body.location ?? base.location,
      status: "makeup",
      topic: base.topic,
    });
    res.status(201).json(doc);
  } catch (err) {
    console.error("createMakeup error:", err);
    res.status(500).json({ error: "Failed to create makeup lesson" });
  }
}

/** ⬇️ YENİ: GERİ AL — dersi tekrar planned yap, tahakkuku sil */
export async function revertLesson(req, res) {
  try {
    const { id } = req.params;
    const les = await Lesson.findById(id);
    if (!les) return res.status(404).json({ error: "lesson not found" });

    // Bu derse bağlı tahakkuk varsa sil
    await Transaction.deleteMany({ linkedLessonId: les._id, type: "lesson_accrual" });

    les.status = "planned";
    les.accrualAmount = undefined;
    await les.save();

    res.json({ ok: true, status: les.status });
  } catch (err) {
    console.error("revertLesson error:", err);
    res.status(500).json({ error: "Failed to revert lesson" });
  }
}
