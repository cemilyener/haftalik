import { useEffect, useState } from "react";
import { Students, Transactions, Lessons } from "../lib/api.js";

export default function StudentModal({ data, onClose }){
  const student = data.student || data.lesson?.studentId;
  const [balance, setBalance] = useState({ balance: 0 });
  const [tx, setTx] = useState([]);
  const [recentLessons, setRecentLessons] = useState([]);

  useEffect(()=>{
    if (!student?._id) return;
    Students.balance(student._id).then(setBalance);
    Transactions.list({ studentId: student._id }).then(setTx);
    Lessons.list({}).then(all=>{
      const mine = all.filter(l=> l.studentId?._id === student._id).slice(-10).reverse();
      setRecentLessons(mine);
    });
  }, [student?._id]);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="font-semibold">{student?.name || "Öğrenci"}</div>
          <button className="px-2 py-1 rounded-md border" onClick={onClose}>Kapat</button>
        </div>

        <div className="p-5 grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500">Bakiye</div>
            <div className={`text-2xl font-bold ${balance.balance<0 ? "text-red-600" : "text-green-700"}`}>
              {balance.balance} TL
            </div>

            <div className="mt-4">
              <div className="text-sm font-semibold mb-2">Son İşlemler</div>
              <ul className="space-y-1 max-h-56 overflow-auto">
                {tx.map(t=>(
                  <li key={t._id} className="text-sm flex justify-between">
                    <span>{t.type}</span>
                    <span className={t.amount<0 ? "text-red-600" : "text-green-700"}>{t.amount}</span>
                  </li>
                ))}
                {tx.length===0 && <li className="text-sm text-gray-500">Kayıt yok</li>}
              </ul>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold mb-2">Son Dersler</div>
            <ul className="space-y-1 max-h-72 overflow-auto">
              {recentLessons.map(l=>(
                <li key={l._id} className="text-sm flex justify-between">
                  <span>{new Date(l.startAt).toLocaleString()}</span>
                  <span className="text-gray-600">{l.status}</span>
                </li>
              ))}
              {recentLessons.length===0 && <li className="text-sm text-gray-500">Kayıt yok</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
