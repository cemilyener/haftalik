// backend/src/controllers/autoPlanController.js
import dayjs from "dayjs";
import Lesson from "../models/Lesson.js";
import Schedule from "../models/Schedule.js";

export async function autoGenerateWeek(req, res) {
  try {
    const monday = dayjs().startOf("week").add(1, "day");
    let count = 0;

    // 🔧 FIX 1: populate düzelt
    const schedules = await Schedule.find({ active: true }).populate("studentId");
    
    console.log(`📅 ${schedules.length} aktif plan bulundu`);

    for (const s of schedules) {
      // 🔧 FIX 2: studentId kontrolü
      if (!s.studentId || !s.studentId._id) {
        console.log(`⚠️ Plan ${s._id} için öğrenci bulunamadı, atlanıyor`);
        continue;
      }

      const date = monday
        .add(s.weekday - 1, "day")
        .hour(Number(s.time.split(":")[0]))
        .minute(Number(s.time.split(":")[1]))
        .second(0)
        .millisecond(0);

      // 🔧 FIX 3: Çakışma kontrolü düzelt
      const exists = await Lesson.findOne({
        studentId: s.studentId._id,
        startAt: { 
          $gte: date.toDate(), 
          $lt: date.add(1, "minute").toDate() // 1 dakikalık aralık
        },
      });

      if (exists) {
        console.log(`⏭️  ${s.studentId.name} için ${date.format("DD.MM HH:mm")} dersi zaten var`);
        continue;
      }

      // Ders oluştur
      const newLesson = await Lesson.create({
        studentId: s.studentId._id,
        startAt: date.toDate(),
        durationMin: s.durationMin || 40,
        location: s.location || "home",
        status: "planned",
        linkedScheduleId: s._id,
      });

      console.log(`✅ ${s.studentId.name} için ders oluşturuldu: ${date.format("DD.MM HH:mm")}`);
      count++;
    }

    res.json({ ok: true, created: count });
  } catch (err) {
    console.error("❌ Auto-generate hatası:", err);
    res.status(500).json({ 
      error: "Auto-generate failed", 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}