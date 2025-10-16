import Lesson from "../models/Lesson.js";
import Schedule from "../models/Schedule.js";

/** start: ISO string (hafta pazartesi başlangıcı)
 *  Dönen: haftalık grid için planned + existing lessons birleşimi
 */
export async function getWeeklyGrid(startISO) {
  const start = new Date(startISO);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);

  const lessons = await Lesson.find({ startAt: { $gte: start, $lt: end } })
    .populate("studentId")
    .lean();

  // İstersen aktif schedule'ları da döndürür, UI'da boş slotları doldurmak için kullanırsın.
  const schedules = await Schedule.find({ active: true }).populate("studentId").lean();

  return { lessons, schedules };
}
