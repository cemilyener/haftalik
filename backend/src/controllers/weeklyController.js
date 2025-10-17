// src/controllers/weeklyController.js
import dayjs from "dayjs";
import Lesson from "../models/Lesson.js";
import Schedule from "../models/Schedule.js";

export async function getWeekly(req, res) {
  try {
    const start = req.query.start
      ? dayjs(req.query.start).startOf("day")
      : dayjs().startOf("week").add(1, "day"); // Pazartesi

    const end = start.add(7, "day");

    // Bu haftanın dersleri
    const lessons = await Lesson.find({
      startAt: { $gte: start.toDate(), $lt: end.toDate() },
    })
      .populate("studentId")
      .lean();

    // Tüm aktif sabit programlar
    const schedules = await Schedule.find({ active: true })
      .populate("studentId")
      .lean();

    // 🆕 SİLİNMİŞ ÖĞRENCİLERE AİT KAYITLARI FİLTRELE
    const validLessons = lessons.filter(l => l.studentId != null);
    const validSchedules = schedules.filter(s => s.studentId != null);

    // 🆕 Orphan kayıtları logla ve otomatik temizle
    const orphanLessons = lessons.filter(l => !l.studentId);
    const orphanSchedules = schedules.filter(s => !s.studentId);
    
    if (orphanLessons.length > 0) {
      console.warn(`⚠️  ${orphanLessons.length} orphan ders bulundu, temizleniyor...`);
      const ids = orphanLessons.map(l => l._id);
      await Lesson.deleteMany({ _id: { $in: ids } });
      console.log(`✅ ${ids.length} orphan ders silindi`);
    }
    
    if (orphanSchedules.length > 0) {
      console.warn(`⚠️  ${orphanSchedules.length} orphan plan bulundu, temizleniyor...`);
      const ids = orphanSchedules.map(s => s._id);
      await Schedule.deleteMany({ _id: { $in: ids } });
      console.log(`✅ ${ids.length} orphan plan silindi`);
    }

    res.json({
      lessons: validLessons,
      schedules: validSchedules,
      period: {
        start: start.format("YYYY-MM-DD"),
        end: end.format("YYYY-MM-DD"),
      },
    });
  } catch (e) {
    console.error("❌ getWeekly error:", e);
    res.status(500).json({ error: "getWeekly failed", message: e.message });
  }
}
