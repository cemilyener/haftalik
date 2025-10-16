import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Reports } from "../lib/api.js";
import { ReceiptText, Wallet, PiggyBank, AlertCircle } from "lucide-react";

export default function PaymentsPage(){
  const [month, setMonth] = useState(dayjs().format("YYYY-MM"));
  const [sum, setSum] = useState({ billed:0, collected:0, remaining:0, forecast:0, period:{} });

  useEffect(()=>{
    (async ()=>{
      const r = await Reports.monthly(month);
      setSum(r);
    })();
  }, [month]);

  return (
    <div className="max-w-3xl bg-white border rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg tracking-tight">Aylık Özet</h2>
        <input type="month" className="border rounded-lg px-3 py-2" value={month} onChange={e=>setMonth(e.target.value)} />
      </div>

      <div className="grid md:grid-cols-4 gap-3">
        <StatCard icon={<ReceiptText />} label="İşlenen tutar" value={`${sum.billed} TL`} />
        <StatCard icon={<Wallet />} label="Tahsil edilen" value={`${sum.collected} TL`} accent="green" />
        <StatCard icon={<PiggyBank />} label="Tahmini gelir" value={`${sum.forecast} TL`} />
        <StatCard icon={<AlertCircle />} label="Kalan" value={`${sum.remaining} TL`} accent="red" />
      </div>

      <div className="text-xs text-gray-500">
        Dönem: {sum.period?.start} → {sum.period?.end}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  const ring =
    accent === "green" ? "ring-emerald-100 bg-emerald-50 text-emerald-700"
  : accent === "red" ? "ring-rose-100 bg-rose-50 text-rose-700"
  : "ring-gray-100 bg-gray-50 text-gray-700";

  return (
    <div className={`p-4 rounded-xl border bg-white hover:shadow-sm transition`}>
      <div className={`inline-flex items-center gap-2 text-xs px-2 py-1 rounded-lg ring-1 ${ring}`}>
        <span className="opacity-80">{icon}</span>
        <span className="font-medium">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
