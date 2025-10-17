import mongoose from "mongoose";

const txSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  date:      { type: Date, default: () => new Date() },
  type:      { 
    type: String, 
    enum: [
      // 🆕 Yeni basit tipler
      "payment",        // Ödeme alındı
      "lesson",         // Ders yapıldı
      // ✅ Eski tipler (geriye uyumluluk)
      "lesson_accrual",
      "monthly_fee",
      "payment_iban",
      "payment_cash",
      "prepayment",
      "discount"
    ], 
    required: true 
  },
  amount:    { type: Number, required: true },
  linkedLessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
  note: { type: String }
}, { timestamps: true });

txSchema.index({ date: 1 });
txSchema.index({ studentId: 1, date: 1 });
txSchema.index({ linkedLessonId: 1 });

export default mongoose.models.Transaction || mongoose.model("Transaction", txSchema);
