import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Weekly, Lessons, Students } from "../lib/api.js";
import { Check, Undo2, X, Ban, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";

dayjs.extend(isoWeek);

// 🆕 6 SLOT SİSTEMİ - Sabahtan Akşama
const SLOTS = [
  { id: 1, label: "Sabah 1", defaultTime: "09:00-10:00" },
  { id: 2, label: "Sabah 2", defaultTime: "10:00-11:00" },
  { id: 3, label: "Öğle", defaultTime: "13:00-14:00" },
  { id: 4, label: "Öğleden Sonra", defaultTime: "15:00-16:00" },
  { id: 5, label: "Akşam 1", defaultTime: "17:00-18:00" },
  { id: 6, label: "Akşam 2", defaultTime: "19:00-21:00" }
];

const WEEKDAYS = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

function mondayStart(d){
  const dt = dayjs(d);
  return dt.isoWeekday() === 1 ? dt : dt.isoWeekday(1);
}

export default function WeeklyPage(){
  const [start, setStart] = useState(mondayStart(new Date()).format("YYYY-MM-DD"));
  const [data, setData] = useState({ lessons: [], schedules: [] });
  const [busyId, setBusyId] = useState(null);
  
  // 🆕 Boş slot sayısını takip et
  const [emptySlots, setEmptySlots] = useState(0);

  const end = useMemo(()=> dayjs(start).add(7, "day"), [start]);

  async function refreshWeekly() {
    const weekly = await Weekly.get(start);
    setData(weekly);

    // Boş slot kontrolü
    const totalSchedules = (weekly.schedules || []).length;
    const actualLessons = (weekly.lessons || []).length;
    const emptyCount = totalSchedules - actualLessons;
    
    setEmptySlots(emptyCount);
  }

  useEffect(()=>{ refreshWeekly(); }, [start]);

  // 🆕 Dersleri slot ve güne göre grupla
  const lessonsByDayAndSlot = useMemo(() => {
    const map = new Map();
    
    (data.lessons || []).forEach(lesson => {
      const lessonDate = dayjs(lesson.startAt);
      const dayIndex = lessonDate.isoWeekday() - 1; // 0=Pzt, 6=Paz
      
      // Slot numarasını kullan (yoksa 1)
      const slotNumber = lesson.slotNumber || 1;
      
      const key = `${dayIndex}-${slotNumber}`;
      map.set(key, lesson);
    });
    
    return map;
  }, [data.lessons]);

  function daysArray(){
    const s = dayjs(start);
    return Array.from({length:7}, (_,i)=> s.add(i,"day"));
  }

  async function handleMarkDone(lessonId){
    try {
      setBusyId(lessonId);
      await Lessons.done(lessonId);
    } finally {
      setBusyId(null);
      await refreshWeekly();
    }
  }

  async function handleCancel(lessonId){
    try {
      setBusyId(lessonId);
      await Lessons.cancel(lessonId);
    } finally {
      setBusyId(null);
      await refreshWeekly();
    }
  }

  async function handleNoShow(lessonId){
    try {
      setBusyId(lessonId);
      await Lessons.noShow(lessonId);
    } finally {
      setBusyId(null);
      await refreshWeekly();
    }
  }

  async function handleRevert(lessonId){
    try {
      setBusyId(lessonId);
      await Lessons.revert(lessonId);
    } finally {
      setBusyId(null);
      await refreshWeekly();
    }
  }

  // Haftayı otomatik oluştur
  async function handleAutoGenerate(){
    if (!confirm(`${emptySlots} yeni ders oluşturulacak. Devam edilsin mi?`)) return;
    
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_BASE}/auto-plan/generate-week`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    const result = await res.json();
    
    alert(`✅ ${result.created} yeni ders oluşturuldu!`);
    await refreshWeekly();
  }

  // 🆕 Bu haftanın derslerini temizle fonksiyonu
  async function handleClearWeek() {
    if (!confirm("⚠️ Bu haftanın TÜM derslerini silmek istediğine emin misin? Bu işlem geri alınamaz!")) return;
    
    try {
      const token = localStorage.getItem("token");
      
      // Bu haftanın başlangıç ve bitiş tarihlerini hesapla
      const weekStart = dayjs(start).toISOString();
      const weekEnd = dayjs(start).add(7, "day").toISOString();
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE}/lessons/clear-week?start=${weekStart}&end=${weekEnd}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const result = await res.json();
      alert(`✅ ${result.deletedCount} ders silindi!`);
      await refreshWeekly();
    } catch (err) {
      alert("❌ Hata: " + err.message);
    }
  }

  return (
    <div className="space-y-4">
      {/* Uyarı mesajı */}
      {emptySlots > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5" size={20}/>
          <div className="flex-1">
            <div className="font-medium text-amber-900">Bu hafta {emptySlots} sabit plan için ders oluşturulmamış</div>
          </div>
          <button
            onClick={handleAutoGenerate}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition whitespace-nowrap">
            Haftayı Oluştur ({emptySlots})
          </button>
        </div>
      )}

      {/* Üst bar */}
      <div className="flex items-center gap-2">
        <button
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border hover:bg-gray-50 transition"
          onClick={()=>setStart(dayjs(start).subtract(7,"day").format("YYYY-MM-DD"))}>
          <ChevronLeft size={16}/> Önceki
        </button>
        <div className="font-semibold text-lg tracking-tight">
          {dayjs(start).format("DD MMM")} – {end.format("DD MMM YYYY")}
        </div>
        <button
          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border hover:bg-gray-50 transition"
          onClick={()=>setStart(dayjs(start).add(7,"day").format("YYYY-MM-DD"))}>
          Sonraki <ChevronRight size={16}/>
        </button>
        
        <button
          onClick={handleClearWeek}
          className="ml-auto px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
          🗑️ Haftayı Temizle
        </button>
        
        <button
          onClick={handleAutoGenerate}
          className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">
          Haftayı Oluştur
        </button>
      </div>

      {/* 🆕 7 GÜN x 6 SLOT TABLO */}
      <div className="grid grid-cols-7 gap-2">
        {daysArray().map((d, dayIdx) => (
          <div key={dayIdx} className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* Gün başlığı */}
            <div className="px-2 py-2 border-b text-sm font-semibold bg-gray-50">
              {WEEKDAYS[dayIdx]} <span className="text-gray-500 font-normal block text-xs">{d.format("DD.MM")}</span>
            </div>

            {/* Slotlar */}
            <div className="p-1 space-y-1">
              {SLOTS.map(slot => {
                const key = `${dayIdx}-${slot.id}`;
                const lesson = lessonsByDayAndSlot.get(key);

                if (!lesson) {
                  return (
                    <div 
                      key={slot.id} 
                      className="h-14 rounded-lg border border-dashed text-xs flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 cursor-pointer transition">
                      <div className="font-medium text-xs">{slot.label}</div>
                      <div className="text-[10px] opacity-60">{slot.defaultTime}</div>
                    </div>
                  );
                }

                const student = lesson.studentId;
                if (!student || !student._id) {
                  return (
                    <div key={slot.id} className="h-14 rounded-lg border border-dashed text-xs flex items-center justify-center text-red-400">
                      <span>Hata</span>
                    </div>
                  );
                }

                const lessonStart = dayjs(lesson.startAt);
                const lessonEnd = lessonStart.add(lesson.durationMin, 'minute');
                
                const statusStyle =
                  lesson.status === "done" ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                : lesson.status === "no_show" ? "bg-rose-50 border-rose-200 text-rose-900"
                : lesson.status === "canceled" ? "bg-gray-50 border-gray-300 text-gray-600"
                : "bg-amber-50 border-amber-200 text-amber-900";

                return (
                  <div key={slot.id}
                       className={`h-14 rounded-lg border ${statusStyle} text-xs p-1.5 flex flex-col justify-between`}>
                    <div>
                      <div className="font-semibold text-xs truncate leading-tight">{student.name}</div>
                      <div className="text-[10px] opacity-75 leading-tight">
                        {lessonStart.format("HH:mm")}-{lessonEnd.format("HH:mm")} • {lesson.durationMin}dk
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 justify-end">
                      {busyId === lesson._id ? (
                        <span className="inline-flex w-5 h-5 items-center justify-center">
                          <Loader2 className="animate-spin" size={10}/>
                        </span>
                      ) : lesson.status === "planned" ? (
                        <>
                          <IconBtn title="Yapıldı" onClick={()=>handleMarkDone(lesson._id)}><Check size={10}/></IconBtn>
                          <IconBtn title="İptal" onClick={()=>handleCancel(lesson._id)}><X size={10}/></IconBtn>
                          <IconBtn title="Gelmedi" onClick={()=>handleNoShow(lesson._id)}><Ban size={10}/></IconBtn>
                        </>
                      ) : (
                        <IconBtn title="Geri Al" onClick={()=>handleRevert(lesson._id)}><Undo2 size={10}/></IconBtn>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconBtn({ title, onClick, children }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="inline-flex items-center justify-center w-5 h-5 rounded border bg-white hover:bg-gray-100 active:scale-95 transition">
      {children}
    </button>
  );
}