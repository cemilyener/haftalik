// backend/src/controllers/lessonsController.js
import mongoose from "mongoose";
import Lesson from "../models/Lesson.js";
import Student from "../models/Student.js";
import Transaction from "../models/Transaction.js";
import { calcLessonAccrual } from "../utils/accrual.js";
import dayjs from "dayjs";

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
    res.status(500).json({ error: "Failed to list lessons", message: err.message });
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
    res.status(500).json({ error: "Failed to create lesson", message: err.message });
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
    res.status(500).json({ error: "Failed to update lesson", message: err.message });
  }
}

async function setStatus(req, res, status) {
  try {
    const { id } = req.params;
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid lesson id" });
    }

    const les = await Lesson.findById(id).populate("studentId");
    if (!les) {
      return res.status(404).json({ error: "lesson not found" });
    }

    if (!les.studentId) {
      return res.status(400).json({ error: "student not found for this lesson" });
    }

    const oldStatus = les.status;
    les.status = status;
    await les.save();

    const s = les.studentId;

    // 🔧 Ders "done" olduğunda bakiye güncelle
    if (status === "done" && oldStatus !== "done") {
      let lessonPrice = 0;
      
      // ✅ SADECE DERS BAŞI ÖDEME MODELİNDE BAKIYE GÜNCELLE
      if (s.rateModel === "per_lesson") {
        lessonPrice = s.lessonFee || 0;
        
        if (lessonPrice > 0) {
          // Bakiyeyi güncelle (ders yaptık = borç arttı)
          s.balance = (s.balance || 0) - lessonPrice;
          
          // Ödeme bekleme tarihi
          if (s.paymentType === "per_lesson" && !s.nextPaymentDue) {
            s.nextPaymentDue = new Date(); // Hemen ödeme bekle
          }
          
          await s.save();
          
          // Transaction kaydet
          await Transaction.create({
            studentId: s._id,
            date: new Date(),
            type: "lesson",
            amount: -lessonPrice,
            linkedLessonId: les._id,
            note: "Ders yapıldı"
          });
          
          les.accrualAmount = -lessonPrice;
          await les.save();
          
          console.log(`✅ Ders tamamlandı: ${s.name} - ${lessonPrice} TL düşüldü. Yeni bakiye: ${s.balance} TL`);
        }
      } 
      // ✅ AYLIK MODEL: Sadece log, bakiye dokunma (ay sonu otomatik işlenecek)
      else if (s.rateModel === "monthly") {
        console.log(`✅ Ders tamamlandı: ${s.name} (Aylık model - bakiye değişmedi)`);
      }
      // ✅ HYBRİD MODEL: Ders başı ücret
      else if (s.rateModel === "hybrid") {
        lessonPrice = s.lessonFee || 0;
        
        if (lessonPrice > 0) {
          s.balance = (s.balance || 0) - lessonPrice;
          await s.save();
          
          await Transaction.create({
            studentId: s._id,
            date: new Date(),
            type: "lesson",
            amount: -lessonPrice,
            linkedLessonId: les._id,
            note: "Ders yapıldı"
          });
          
          les.accrualAmount = -lessonPrice;
          await les.save();
          
          console.log(`✅ Ders tamamlandı: ${s.name} - ${lessonPrice} TL düşüldü. Yeni bakiye: ${s.balance} TL`);
        }
      }

      return res.json({ 
        ok: true, 
        status: les.status, 
        balance: s.balance,
        accrual: les.accrualAmount ?? 0 
      });
    }

    return res.json({ ok: true, status: les.status });
  } catch (err) {
    console.error("setStatus error:", err);
    res.status(500).json({ 
      error: "Failed to update status", 
      message: err.message
    });
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
    res.status(500).json({ error: "Failed to create makeup lesson", message: err.message });
  }
}

export async function revertLesson(req, res) {
  try {
    const { id } = req.params;
    
    // 🔧 FIX: ID kontrolü
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid lesson id" });
    }

    const les = await Lesson.findById(id);
    if (!les) {
      return res.status(404).json({ error: "lesson not found" });
    }

    // Bu derse bağlı tahakkuk varsa sil
    const deleted = await Transaction.deleteMany({ 
      linkedLessonId: les._id, 
      type: "lesson_accrual" 
    });

    console.log(`🔄 ${deleted.deletedCount} tahakkuk kaydı silindi`);

    les.status = "planned";
    les.accrualAmount = undefined;
    await les.save();

    res.json({ ok: true, status: les.status });
  } catch (err) {
    console.error("revertLesson error:", err);
    res.status(500).json({ 
      error: "Failed to revert lesson", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

export async function deleteLesson(req, res) {
  try {
    const { id } = req.params;
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid lesson id" });
    }

    const lesson = await Lesson.findByIdAndDelete(id);
    if (!lesson) {
      return res.status(404).json({ error: "lesson not found" });
    }

    // İlgili transaction'ları da sil
    await Transaction.deleteMany({ linkedLessonId: id });

    console.log(`🗑️ Ders silindi: ${id}`);
    res.json({ ok: true });
  } catch (err) {
    console.error("deleteLesson error:", err);
    res.status(500).json({ 
      error: "Failed to delete lesson", 
      message: err.message 
    });
  }
}

export async function clearWeek(req, res) {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ error: "start and end dates required" });
    }

    const result = await Lesson.deleteMany({
      startAt: {
        $gte: new Date(start),
        $lt: new Date(end)
      }
    });

    console.log(`🗑️ ${result.deletedCount} ders silindi (${start} - ${end})`);
    res.json({ ok: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error("❌ Clear week hatası:", err);
    res.status(500).json({ error: "clearWeek failed", message: err.message });
  }
}