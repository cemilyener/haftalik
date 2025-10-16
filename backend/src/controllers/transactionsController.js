import Transaction from "../models/Transaction.js";

export async function listTransactions(req,res){
  const q = {};
  if (req.query.studentId) q.studentId = req.query.studentId;
  res.json(await Transaction.find(q).sort({date:-1}));
}
export async function createTransaction(req,res){
  const doc = await Transaction.create(req.body);
  res.status(201).json(doc);
}
