import mongoose from "mongoose";

const txSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  date:      { type: Date, default: () => new Date() },
  type:      { type: String, enum: [
    "lesson_accrual", // işlenen tutar (ders)
    "monthly_fee",    // işlenen tutar (aylık)
    "payment_iban",   // tahsilat
    "payment_cash",   // tahsilat
    "prepayment",     // avans
    "discount"        // indirim (-)
  ], required: true },
  amount:    { type: Number, required: true }, // + tahsilat / avans, - işlenen tutar
  linkedLessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson" },
  note: { type: String }
}, { timestamps: true });

// Performans indeksleri
txSchema.index({ date: 1 });
txSchema.index({ studentId: 1, date: 1 });
txSchema.index({ linkedLessonId: 1 });

export default mongoose.models.Transaction || mongoose.model("Transaction", txSchema);
