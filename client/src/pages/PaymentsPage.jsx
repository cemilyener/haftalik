import { useEffect, useState } from "react";
import { Reports } from "../lib/api.js";
import { Calendar, TrendingUp, DollarSign, AlertCircle } from "lucide-react";

export default function PaymentsPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [month]);

  async function loadData() {
    setLoading(true);
    try {
      const result = await Reports.monthly(month);
      setData(result);
    } catch (err) {
      console.error("Rapor yükleme hatası:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Yükleniyor...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Veri yüklenemedi</div>
      </div>
    );
  }

  const { summary, students, period } = data;

  return (
    <div className="space-y-6">
      {/* Ay Seçici */}
      <div className="flex items-center gap-4">
        <Calendar className="text-gray-600" size={24} />
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        />
        <h1 className="text-2xl font-bold text-gray-800">
          {period.monthName} Özeti
        </h1>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Beklenen Gelir */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-blue-600" size={20} />
            <div className="text-sm text-blue-600 font-medium">Beklenen Gelir</div>
          </div>
          <div className="text-3xl font-bold text-blue-900">
            {summary.expected.toLocaleString('tr-TR')} TL
          </div>
        </div>

        {/* Alınan Ödeme */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-green-600" size={20} />
            <div className="text-sm text-green-600 font-medium">Alınan Ödeme</div>
          </div>
          <div className="text-3xl font-bold text-green-900">
            {summary.collected.toLocaleString('tr-TR')} TL
          </div>
        </div>

        {/* Kalan Alacak */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-orange-600" size={20} />
            <div className="text-sm text-orange-600 font-medium">Kalan Alacak</div>
          </div>
          <div className="text-3xl font-bold text-orange-900">
            {summary.remaining.toLocaleString('tr-TR')} TL
          </div>
        </div>

        {/* Tahsilat Oranı */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-sm text-purple-600 font-medium">Tahsilat Oranı</div>
          </div>
          <div className="text-3xl font-bold text-purple-900">
            %{summary.percentage}
          </div>
          <div className="mt-2 bg-purple-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${summary.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Öğrenci Detayları */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Öğrenci Bazında Detay</h2>
        
        {students.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Bu ay için öğrenci kaydı bulunamadı
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((student, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-lg border-2 ${
                  student.status === "paid" 
                    ? "bg-green-50 border-green-200" 
                    : student.status === "partial"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold text-lg">{student.name}</div>
                    <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                      {student.calculation}
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ${
                    student.status === "paid" ? "text-green-700" :
                    student.status === "partial" ? "text-yellow-700" :
                    "text-red-700"
                  }`}>
                    {student.status === "paid" ? "✅" : 
                     student.status === "partial" ? "🟡" : "❌"}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Beklenen</div>
                    <div className="font-semibold">{student.expected.toLocaleString('tr-TR')} TL</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Alınan</div>
                    <div className="font-semibold text-green-700">{student.collected.toLocaleString('tr-TR')} TL</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Kalan</div>
                    <div className="font-semibold text-orange-700">{student.remaining.toLocaleString('tr-TR')} TL</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Oran</div>
                    <div className="font-semibold">%{student.percentage}</div>
                  </div>
                </div>

                {/* İlerleme çubuğu */}
                <div className="mt-3 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      student.status === "paid" ? "bg-green-600" :
                      student.status === "partial" ? "bg-yellow-600" :
                      "bg-red-600"
                    }`}
                    style={{ width: `${Math.min(student.percentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
