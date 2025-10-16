import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  accountType: { type: String, enum: ["person","organization"], default: "person" }, // Kulüp = organization
  name: { type: String, required: true },
  channel: { type: String, enum: ["home","online","club"], default: "home" },
  contacts: {
    parentName: String,
    phones: [String],
    email: String
  },
  rateModel: { type: String, enum: ["per_lesson","monthly","hybrid"], required: true },
  lessonFee: Number,          // 40 dk ders ücreti (per_lesson/hybrid)
  hourFee: Number,            // 60 dk sabit fiyatı (Defne gibi)
  monthlyFee: Number,         // monthly için
  monthlyBillingDay: Number,  // 1..28 (Berat=1, Kulüp=24, Arda=?)
  reliability: {
    oftenMisses: Boolean,
    oftenLatePay: Boolean
  },
  notes: String
}, { timestamps: true });

studentSchema.index({ name: 1 });

export default mongoose.models.Student || mongoose.model("Student", studentSchema);
