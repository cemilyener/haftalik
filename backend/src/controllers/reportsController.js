import dayjs from "dayjs";
import Transaction from "../models/Transaction.js";

const BILL_TYPES = ["lesson_accrual", "monthly_fee"]; // tahakkuk
const PAY_TYPES  = ["payment_iban", "payment_cash"];  // tahsilat (prepayment'i dahil etmiyoruz)

export async function monthlySummary(req, res) {
  try {
    const monthParam = req.query.month; // "YYYY-MM" opsiyonel
    const start = monthParam ? dayjs(monthParam + "-01") : dayjs().startOf("month");
    const end = start.add(1, "month");

    const tx = await Transaction.find({
      date: { $gte: start.toDate(), $lt: end.toDate() }
    }).lean();

    const billed = tx
      .filter(t => BILL_TYPES.includes(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const collected = tx
      .filter(t => PAY_TYPES.includes(t.type))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const remaining = billed - collected;

    res.json({
      period: { start: start.format("YYYY-MM-DD"), end: end.format("YYYY-MM-DD") },
      billed,       // bu ay yazılan tahakkuk (ders + aylık)
      collected,    // bu ay tahsil edilen nakit+iban
      remaining,    // bu ay tahsil edilmesi kalan
      forecast: billed // MVP: tahmini geliri billed olarak alıyoruz
    });
  } catch (err) {
    console.error("monthlySummary error:", err);
    res.status(500).json({ error: "Failed to build monthly summary" });
  }
}
