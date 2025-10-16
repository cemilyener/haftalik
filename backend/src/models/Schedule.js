import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  weekday:   { type: Number, min:1, max:7, required: true }, // 1=Pzt ... 7=Paz
  time:      { type: String, required: true },               // "HH:mm"
  durationMin: { type: Number, default: 40 },
  location:  { type: String, enum: ["home","online","club"], default: "home" },
  active:    { type: Boolean, default: true }
}, { timestamps: true });

// Performans indeksleri
scheduleSchema.index({ studentId: 1 });
scheduleSchema.index({ weekday: 1, time: 1 });

export default mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);
