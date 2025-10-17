// backend/src/controllers/autoPlanController.js
import dayjs from "dayjs";
import Lesson from "../models/Lesson.js";
import Schedule from "../models/Schedule.js";

export async function autoGenerateWeek(req, res) {
  try {
    const monday = dayjs().startOf("week").add(1, "day");
    let count = 0;

    // Aktif programları getir
    const schedules = await Schedule.find({ active: true }).populate("studentId");
    
    console.log(`📅 ${schedules.length} aktif plan bulundu`);

    for (const s of schedules) {
      // Öğrenci kontrolü
      if (!s.studentId || !s.studentId._id) {
        console.log(`⚠️ Plan ${s._id} için öğrenci bulunamadı, atlanıyor`);
        continue;
      }
      
      // 🆕 Geçici program kontrolü (endDate geçmişse atla)
      if (s.endDate && dayjs(s.endDate).isBefore(dayjs())) {
        console.log(`⏭️ ${s.studentId.name} için geçici program süresi dolmuş, atlanıyor`);
        continue;
      }

      // 🔧 Ders tarihini hesapla - startTime veya eski time alanını kullan
      const timeString = s.startTime || s.time;
      if (!timeString) {
        console.log(`⚠️ ${s.studentId.name} için saat bilgisi yok, atlanıyor`);
        continue;
      }

      const [hour, minute] = timeString.split(":");
      const date = monday
        .add(s.weekday - 1, "day")
        .hour(Number(hour))
        .minute(Number(minute))
        .second(0)
        .millisecond(0);

      // Çakışma kontrolü
      const exists = await Lesson.findOne({
        studentId: s.studentId._id,
        startAt: { 
          $gte: date.toDate(), 
          $lt: date.add(1, "minute").toDate()
        },
      });

      if (exists) {
        console.log(`⏭️ ${s.studentId.name} için ${date.format("DD.MM HH:mm")} dersi zaten var`);
        continue;
      }

      // 🆕 Ders oluştur (slot numarasıyla)
      const newLesson = await Lesson.create({
        studentId: s.studentId._id,
        startAt: date.toDate(),
        durationMin: s.durationMin || 40,
        location: s.location || "home",
        status: "planned",
        linkedScheduleId: s._id,
        slotNumber: s.slotNumber || 1 // 🆕 Slot numarası
      });

      console.log(`✅ ${s.studentId.name} için ders oluşturuldu: ${date.format("DD.MM HH:mm")} (Slot ${s.slotNumber || 1})`);
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