import Student from "../models/Student.js";
import Transaction from "../models/Transaction.js";

export async function runDailyBilling(req,res){
  const today = new Date();
  const day = today.getDate();
  const monthly = await Student.find({ rateModel:"monthly", monthlyFee:{ $gt:0 }, monthlyBillingDay: day });

  for (const s of monthly) {
    await Transaction.create({
      studentId: s._id,
      date: today,
      type: "monthly_fee",
      amount: -Math.abs(s.monthlyFee),
      note: "Monthly billing"
    });
  }
  res.json({ ok:true, billed: monthly.length, day });
}
