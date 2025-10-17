// backend/src/controllers/studentsController.js
import mongoose from "mongoose";
import Student from "../models/Student.js";
import Transaction from "../models/Transaction.js";
import Lesson from "../models/Lesson.js";
import Schedule from "../models/Schedule.js";

export async function listStudents(req, res) {
  try {
    const { q, limit = 100, skip = 0 } = req.query;
    const find = q ? { name: { $regex: new RegExp(q, "i") } } : {};
    
    const docs = await Student.find(find)
      .sort({ name: 1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();
    
    res.json(docs);
  } catch (err) {
    console.error("❌ listStudents error:", err);
    res.status(500).json({ error: "Failed to list students", message: err.message });
  }
}

export async function createStudent(req, res) {
  try {
    const payload = req.body || {};
    if (!payload.name) return res.status(400).json({ error: "name is required" });
    if (!payload.rateModel) return res.status(400).json({ error: "rateModel is required" });

    const doc = await Student.create(payload);
    console.log(`✅ Öğrenci oluşturuldu: ${doc.name}`);
    res.status(201).json(doc);
  } catch (err) {
    console.error("❌ createStudent error:", err);
    res.status(500).json({ error: "Failed to create student", message: err.message });
  }
}

export async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid id" });
    }

    const doc = await Student.findByIdAndUpdate(id, req.body, { new: true });
    if (!doc) return res.status(404).json({ error: "student not found" });

    console.log(`✅ Öğrenci güncellendi: ${doc.name}`);
    res.json(doc);
  } catch (err) {
    console.error("❌ updateStudent error:", err);
    res.status(500).json({ error: "Failed to update student", message: err.message });
  }
}

/**
 * 🔥 CASCADE DELETE - Öğrenci silinirken tüm ilişkili kayıtları da sil
 */
export async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid id" });
    }

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ error: "student not found" });
    }

    console.log(`🗑️  Öğrenci siliniyor: ${student.name} (${id})`);

    // 1️⃣ İlişkili schedules sil
    const schedules = await Schedule.deleteMany({ studentId: id });
    console.log(`   ↳ ${schedules.deletedCount} sabit plan silindi`);

    // 2️⃣ İlişkili lessons sil
    const lessons = await Lesson.deleteMany({ studentId: id });
    console.log(`   ↳ ${lessons.deletedCount} ders silindi`);

    // 3️⃣ İlişkili transactions sil
    const transactions = await Transaction.deleteMany({ studentId: id });
    console.log(`   ↳ ${transactions.deletedCount} işlem silindi`);

    // 4️⃣ Son olarak öğrenciyi sil
    await Student.findByIdAndDelete(id);
    console.log(`✅ Öğrenci tamamen silindi: ${student.name}`);

    res.status(204).end();
  } catch (err) {
    console.error("❌ deleteStudent error:", err);
    res.status(500).json({ 
      error: "Failed to delete student", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}

export async function getBalance(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "invalid id" });
    }

    const studentObjectId = new mongoose.Types.ObjectId(id);
    const agg = await Transaction.aggregate([
      { $match: { studentId: studentObjectId } },
      { $group: { _id: "$studentId", balance: { $sum: "$amount" } } }
    ]);

    res.json({ balance: agg[0]?.balance ?? 0 });
  } catch (err) {
    console.error("❌ getBalance error:", err);
    res.status(500).json({ error: "Failed to get balance", message: err.message });
  }
}

/**
 * 🧹 Orphan (sahipsiz) kayıtları temizle
 */
export async function cleanupOrphanRecords(req, res) {
  try {
    const allStudentIds = (await Student.find({}, "_id").lean()).map(s => s._id.toString());
    
    // Orphan schedules
    const orphanSchedules = await Schedule.find({}).populate("studentId").lean();
    const toDeleteSchedules = orphanSchedules.filter(s => !s.studentId).map(s => s._id);
    
    // Orphan lessons
    const orphanLessons = await Lesson.find({}).populate("studentId").lean();
    const toDeleteLessons = orphanLessons.filter(l => !l.studentId).map(l => l._id);
    
    if (toDeleteSchedules.length > 0) {
      await Schedule.deleteMany({ _id: { $in: toDeleteSchedules } });
    }
    if (toDeleteLessons.length > 0) {
      await Lesson.deleteMany({ _id: { $in: toDeleteLessons } });
    }
    
    console.log(`🧹 Temizlendi: ${toDeleteSchedules.length} schedule, ${toDeleteLessons.length} lesson`);
    
    res.json({
      cleaned: {
        schedules: toDeleteSchedules.length,
        lessons: toDeleteLessons.length
      }
    });
  } catch (err) {
    console.error("❌ cleanupOrphanRecords error:", err);
    res.status(500).json({ error: "Cleanup failed", message: err.message });
  }
}