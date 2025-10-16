import dayjs from "dayjs";
import Lesson from "../models/Lesson.js";
import Schedule from "../models/Schedule.js";

// Haftalık dersleri otomatik oluşturur
export async function autoGenerateWeek(req, res) {
  try {
    const monday = dayjs().startOf("week").add(1, "day");
    let count = 0;

    const schedules = await Schedule.find({ active: true }).populate("studentId");
    for (const s of schedules) {
      const date = monday
        .add(s.weekday - 1, "day")
        .hour(Number(s.time.split(":")[0]))
        .minute(Number(s.time.split(":")[1]))
        .second(0)
        .millisecond(0);

      const exists = await Lesson.findOne({
        studentId: s.studentId._id,
        startAt: { $gte: date.toDate(), $lt: date.add(1, "hour").toDate() },
      });
      if (exists) continue;

      await Lesson.create({
        studentId: s.studentId._id,
        startAt: date.toDate(),
        durationMin: s.durationMin,
        location: s.location,
        status: "planned",
        linkedScheduleId: s._id,
      });
      count++;
    }

    res.json({ ok: true, created: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Auto-generate failed" });
  }
}
