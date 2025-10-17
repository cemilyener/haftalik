import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  weekday: { type: Number, min:1, max:7, required: true }, // 1=Pzt ... 7=Paz
  
  // 🆕 SLOT SİSTEMİ
  slotNumber: { type: Number, min:1, max:6, default: 1 }, // 1-6 arası slot
  startTime: { type: String, required: true }, // "14:30" gibi
  
  durationMin: { type: Number, default: 40 },
  location: { type: String, enum: ["home","online","club"], default: "home" },
  active: { type: Boolean, default: true },
  
  // 🆕 DERS TİPİ
  lessonType: { 
    type: String, 
    enum: ["regular", "makeup", "extra"], 
    default: "regular" 
  },
  
  // 🆕 GEÇİCİ PROGRAM (Telafi için)
  endDate: Date, // Bu tarihten sonra bu program geçersiz
  
  notes: String
}, { timestamps: true });

scheduleSchema.index({ studentId: 1 });
scheduleSchema.index({ weekday: 1, slotNumber: 1 });

export default mongoose.models.Schedule || mongoose.model("Schedule", scheduleSchema);
