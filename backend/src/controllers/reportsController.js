import dayjs from "dayjs";
import Transaction from "../models/Transaction.js";
import Student from "../models/Student.js";
import Schedule from "../models/Schedule.js";

// 🔧 YENİ VE ESKİ TİPLERİ BİRLİKTE DESTEKLE
const BILL_TYPES = ["lesson_accrual", "monthly_fee", "lesson"];
const PAY_TYPES  = ["payment_iban", "payment_cash", "prepayment", "payment"];

export async function monthlySummary(req, res) {
  try {
    const monthParam = req.query.month; // "YYYY-MM" opsiyonel
    const start = monthParam ? dayjs(monthParam + "-01") : dayjs().startOf("month");
    const end = start.add(1, "month");

    // 🆕 1. AKTİF ÖĞRENCİLERİ AL
    const students = await Student.find({}).lean();
    
    // 🆕 2. HER ÖĞRENCİ İÇİN BU AYIN BEKLENEN GELİRİNİ HESAPLA
    const expectedIncomes = [];
    let totalExpected = 0;

    for (const student of students) {
      let expectedAmount = 0;
      let calculation = "";

      // Aylık model
      if (student.rateModel === "monthly") {
        expectedAmount = student.monthlyFee || 0;
        calculation = `Aylık sabit: ${expectedAmount} TL`;
      }
      // Ders başı veya saatlik model
      else if (student.rateModel === "per_lesson" || student.rateModel === "hybrid") {
        // Bu öğrencinin aktif schedule'larını al
        const schedules = await Schedule.find({ 
          studentId: student._id, 
          active: true 
        }).lean();

        // Bu ayın hafta sayısını hesapla (yaklaşık 4 hafta)
        const weeksInMonth = 4;
        const lessonsPerWeek = schedules.length;
        const totalLessons = lessonsPerWeek * weeksInMonth;
        
        const feePerLesson = student.lessonFee || 0;
        expectedAmount = totalLessons * feePerLesson;
        calculation = `${totalLessons} ders (${lessonsPerWeek} × ${weeksInMonth} hafta) × ${feePerLesson} TL`;
      }

      if (expectedAmount > 0) {
        expectedIncomes.push({
          studentId: student._id,
          studentName: student.name,
          expected: expectedAmount,
          calculation: calculation,
          rateModel: student.rateModel
        });
        totalExpected += expectedAmount;
      }
    }

    // 🆕 3. BU AYDA ALINAN ÖDEMELERİ HESAPLA (Öğrenci bazında)
    const payments = await Transaction.find({
      date: { $gte: start.toDate(), $lt: end.toDate() },
      type: { $in: PAY_TYPES }
    }).lean();

    // Öğrenci bazında ödeme toplamları
    const paymentsByStudent = {};
    let totalCollected = 0;

    payments.forEach(tx => {
      const studentId = tx.studentId.toString();
      if (!paymentsByStudent[studentId]) {
        paymentsByStudent[studentId] = 0;
      }
      paymentsByStudent[studentId] += Math.abs(tx.amount);
      totalCollected += Math.abs(tx.amount);
    });

    // 🆕 4. BEKLENEN VE ALINAN'I BİRLEŞTİR
    const studentDetails = expectedIncomes.map(item => {
      const collected = paymentsByStudent[item.studentId.toString()] || 0;
      const remaining = item.expected - collected;
      const percentage = item.expected > 0 ? Math.round((collected / item.expected) * 100) : 0;

      return {
        name: item.studentName,
        expected: item.expected,
        collected: collected,
        remaining: remaining,
        percentage: percentage,
        calculation: item.calculation,
        status: percentage >= 100 ? "paid" : percentage > 0 ? "partial" : "unpaid"
      };
    });

    // Kalan alacak
    const totalRemaining = totalExpected - totalCollected;

    console.log(`📊 ${start.format("YYYY-MM")} Özeti:`);
    console.log(`   Beklenen: ${totalExpected} TL`);
    console.log(`   Alınan: ${totalCollected} TL`);
    console.log(`   Kalan: ${totalRemaining} TL`);

    res.json({
      period: { 
        start: start.format("YYYY-MM-DD"), 
        end: end.format("YYYY-MM-DD"),
        month: start.format("YYYY-MM"),
        monthName: start.format("MMMM YYYY")
      },
      summary: {
        expected: totalExpected,      // Bu ay beklenen toplam gelir
        collected: totalCollected,    // Bu ay alınan toplam ödeme
        remaining: totalRemaining,    // Kalan alacak
        percentage: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0
      },
      students: studentDetails.sort((a, b) => b.remaining - a.remaining) // En çok borçlu önce
    });
  } catch (err) {
    console.error("monthlySummary error:", err);
    res.status(500).json({ error: "Failed to build monthly summary", message: err.message });
  }
}
