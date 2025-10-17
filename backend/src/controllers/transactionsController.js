import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import Student from "../models/Student.js";

/**
 * 🗑️ Transaction sil ve bakiyeyi düzelt
 */
export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;
    
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Geçersiz ID" });
    }
    
    const tx = await Transaction.findById(id);
    if (!tx) {
      return res.status(404).json({ error: "Transaction bulunamadı" });
    }
    
    // Öğrenciyi bul
    const student = await Student.findById(tx.studentId);
    if (!student) {
      return res.status(404).json({ error: "Öğrenci bulunamadı" });
    }
    
    // Bakiyeyi düzelt (transaction'ı geri al)
    student.balance = (student.balance || 0) - tx.amount;
    await student.save();
    
    // Transaction'ı sil
    await Transaction.findByIdAndDelete(id);
    
    console.log(`🗑️  Transaction silindi: ${tx.type} ${tx.amount} TL - Yeni bakiye: ${student.balance} TL`);
    
    res.json({ 
      ok: true, 
      message: "Transaction silindi",
      newBalance: student.balance 
    });
  } catch (err) {
    console.error("❌ deleteTransaction error:", err);
    res.status(500).json({ error: "Transaction silinemedi", message: err.message });
  }
}

/**
 * 📋 Öğrenciye göre transaction listesi
 */
export async function listTransactionsByStudent(req, res) {
  try {
    const { studentId } = req.query;
    const limit = parseInt(req.query.limit) || 50;
    
    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      return res.status(400).json({ error: "Geçerli bir studentId gerekli" });
    }
    
    const transactions = await Transaction.find({ studentId })
      .sort({ date: -1 })
      .limit(limit)
      .lean();
    
    res.json(transactions);
  } catch (err) {
    console.error("❌ listTransactionsByStudent error:", err);
    res.status(500).json({ error: "Transaction listelenemedi", message: err.message });
  }
}

export async function listTransactions(req,res){
  const q = {};
  if (req.query.studentId) q.studentId = req.query.studentId;
  res.json(await Transaction.find(q).sort({date:-1}));
}
export async function createTransaction(req,res){
  const doc = await Transaction.create(req.body);
  res.status(201).json(doc);
}
