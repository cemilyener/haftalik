// backend/src/controllers/studentsController.js
import mongoose from "mongoose";
import dayjs from "dayjs";
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
 * 💰 ÖDEME KAYDET
 */
export async function recordPayment(req, res) {
  try {
    const { id } = req.params;
    const { amount, date } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Geçerli bir tutar girin" });
    }
    
    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ error: "Öğrenci bulunamadı" });
    }
    
    // Bakiyeyi güncelle
    student.balance = (student.balance || 0) + Number(amount);
    student.lastPaymentDate = date ? new Date(date) : new Date();
    
    // Ödeme şekline göre nextPaymentDue güncelle
    const paymentDate = dayjs(student.lastPaymentDate);
    
    if (student.paymentType === "prepaid") {
      // Peşin: 1 ay sonra
      student.nextPaymentDue = paymentDate.add(1, "month").toDate();
    } else if (student.paymentType === "month_end") {
      // Ay sonu: Bir sonraki ay sonu
      student.nextPaymentDue = paymentDate.add(1, "month").endOf("month").toDate();
    } else if (student.paymentType === "per_lesson") {
      // Ders başı: Bakiye 0'a yakınsa null
      student.nextPaymentDue = student.balance >= 0 ? null : new Date();
    }
    
    student.reminderSent = false;
    await student.save();
    
    // Transaction kaydet
    await Transaction.create({
      studentId: student._id,
      date: student.lastPaymentDate,
      type: "payment",
      amount: Number(amount),
      note: req.body.note || "Ödeme alındı"
    });
    
    console.log(`💰 ${student.name} - ${amount} TL ödeme kaydedildi. Yeni bakiye: ${student.balance} TL`);
    
    res.json({ 
      ok: true, 
      balance: student.balance,
      nextPaymentDue: student.nextPaymentDue
    });
  } catch (err) {
    console.error("❌ recordPayment error:", err);
    res.status(500).json({ error: "Ödeme kaydedilemedi", message: err.message });
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

/**
 * 🧨 TÜM TRANSACTION'LARI SİL (Test/temizlik için)
 */
export async function deleteAllTransactions(req, res) {
  try {
    const result = await Transaction.deleteMany({});
    console.log(`🧨 ${result.deletedCount} transaction silindi`);
    res.json({ 
      success: true,
      deleted: result.deletedCount,
      message: `${result.deletedCount} transaction başarıyla silindi`
    });
  } catch (err) {
    console.error("❌ deleteAllTransactions error:", err);
    res.status(500).json({ error: "Failed", message: err.message });
  }
}

/**
 * 🧹 VERİTABANINI TEMİZLE - Sadece bir kez kullan!
 */
export async function resetDatabase(req, res) {
  try {
    // Tüm öğrencileri sil
    const students = await Student.deleteMany({});
    // Tüm dersleri sil
    const lessons = await Lesson.deleteMany({});
    // Tüm sabit planları sil
    const schedules = await Schedule.deleteMany({});
    // Tüm işlemleri sil
    const transactions = await Transaction.deleteMany({});
    
    console.log("🧹 Veritabanı temizlendi");
    
    res.json({
      success: true,
      deleted: {
        students: students.deletedCount,
        lessons: lessons.deletedCount,
        schedules: schedules.deletedCount,
        transactions: transactions.deletedCount
      }
    });
  } catch (err) {
    console.error("❌ resetDatabase error:", err);
    res.status(500).json({ error: "Failed", message: err.message });
  }
}