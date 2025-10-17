import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  startAt:   { type: Date, required: true },
  durationMin: { type: Number, default: 40 },
  location:  { type: String, enum: ["home","online","club"], default: "home" },
  status:    { type: String, enum: ["planned","done","canceled","no_show","makeup"], default: "planned" },
  topic:     { type: String },
  homeworkGiven: { type: String },
  homeworkDue:   { type: Date },
  notes:     { type: String },
  accrualAmount: { type: Number },
  linkedScheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule" },
  slotNumber: { type: Number, min: 1, max: 6 } // 🆕 Slot numarası
}, { timestamps: true });

lessonSchema.index({ startAt: 1 });
lessonSchema.index({ studentId: 1, startAt: 1 });
lessonSchema.index({ slotNumber: 1 }); // 🆕

export default mongoose.models.Lesson || mongoose.model("Lesson", lessonSchema);
