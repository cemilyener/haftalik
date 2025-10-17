// src/controllers/schedulesController.js
import Schedule from "../models/Schedule.js";
import Lesson from "../models/Lesson.js";
import dayjs from "dayjs";

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
    
    // Eski schedule'ı al
    const oldSchedule = await Schedule.findById(id);
    if (!oldSchedule) return res.status(404).json({ error: "not found" });
    
    // Schedule'ı güncelle
    const updatedSchedule = await Schedule.findByIdAndUpdate(id, req.body, { new: true });
    
    // 🔧 Bu schedule'a bağlı GELECEK dersleri güncelle
    const now = new Date();
    const linkedLessons = await Lesson.find({
      linkedScheduleId: id,
      startAt: { $gte: now }, // Sadece gelecekteki dersler
      status: "planned" // Sadece planlanmış dersler
    });
    
    console.log(`📅 ${linkedLessons.length} gelecek ders bulundu, güncelleniyor...`);
    
    for (const lesson of linkedLessons) {
      const lessonDate = dayjs(lesson.startAt);
      
      // Yeni saat bilgisi varsa güncelle
      if (req.body.startTime) {
        const [newHour, newMinute] = req.body.startTime.split(":");
        const newStartAt = lessonDate
          .hour(Number(newHour))
          .minute(Number(newMinute))
          .second(0)
          .millisecond(0)
          .toDate();
        
        lesson.startAt = newStartAt;
      }
      
      // Diğer alanları güncelle
      if (req.body.durationMin) lesson.durationMin = req.body.durationMin;
      if (req.body.location) lesson.location = req.body.location;
      if (req.body.slotNumber) lesson.slotNumber = req.body.slotNumber;
      
      await lesson.save();
      console.log(`✅ Ders güncellendi: ${lessonDate.format("DD.MM.YYYY HH:mm")} -> ${dayjs(lesson.startAt).format("DD.MM.YYYY HH:mm")}`);
    }
    
    res.json({ 
      ok: true, 
      schedule: updatedSchedule,
      updatedLessons: linkedLessons.length
    });
  } catch (e) {
    console.error("❌ updateSchedule hatası:", e);
    res.status(400).json({ error: "updateSchedule failed", message: e.message });
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
