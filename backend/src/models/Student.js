import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  // ✅ ESKİ ALANLAR - KORUNUYOR
  accountType: { type: String, enum: ["person","organization"], default: "person" },
  name: { type: String, required: true },
  channel: { type: String, enum: ["home","online","club"], default: "home" },
  contacts: {
    parentName: String,
    phones: [String],
    email: String
  },
  
  // 💰 ÜCRET MODELİ - BASITLEŞTIRILDI
  rateModel: { type: String, enum: ["per_lesson","monthly","hybrid"], required: true },
  lessonFee: Number,          // 40 dk ders ücreti
  hourFee: Number,            // 60 dk sabit fiyatı
  monthlyFee: Number,         // Aylık ücret
  monthlyBillingDay: Number,  // 1..28
  
  // 🆕 YENİ: ÖDEME ŞEKLİ
  paymentType: { 
    type: String, 
    enum: ["prepaid", "month_end", "per_lesson"],
    default: "prepaid"
  },
  
  // 🆕 YENİ: BAKİYE TAKİBİ
  balance: { type: Number, default: 0 },
  lastPaymentDate: Date,
  nextPaymentDue: Date,
  
  // 🆕 YENİ: HATIRLATMA
  reminderSent: { type: Boolean, default: false },
  
  // ✅ ESKİ ALANLAR - KORUNUYOR
  reliability: {
    oftenMisses: Boolean,
    oftenLatePay: Boolean
  },
  notes: String
}, { timestamps: true });

studentSchema.index({ name: 1 });
studentSchema.index({ nextPaymentDue: 1 });

export default mongoose.models.Student || mongoose.model("Student", studentSchema);
