import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Weekly, Lessons, Students } from "../lib/api.js";
import { Check, Undo2, X, Ban, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";

dayjs.extend(isoWeek);

const DAY_SLOT_TIMES = ["09:30","13:00","18:00","19:30","20:00","20:30"];
const WEEKDAYS = ["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"];

function mondayStart(d){
  const dt = dayjs(d);
  return dt.isoWeekday() === 1 ? dt : dt.isoWeekday(1);
}

export default function WeeklyPage(){
  const [start, setStart] = useState(mondayStart(new Date()).format("YYYY-MM-DD"));
  const [data, setData] = useState({ lessons: [], schedules: [] });
  const [students, setStudents] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [lessonsMapLocal, setLessonsMapLocal] = useState(new Map());
  
  // 🆕 Boş slot sayısını takip et
  const [emptySlots, setEmptySlots] = useState(0);
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);

  const end = useMemo(()=> dayjs(start).add(7, "day"), [start]);

  useEffect(()=>{
    (async ()=>{
      const studs = await Students.list();
      setStudents(studs);
    })();
  }, []);

  async function refreshWeekly() {
    const weekly = await Weekly.get(start);
    setData(weekly);

    const _map = new Map();
    (weekly.lessons||[]).forEach(l=>{
      const dt = dayjs(l.startAt);
      _map.set(`${dt.format("YYYY-MM-DD")}|${dt.format("HH:mm")}`, l);
    });
    setLessonsMapLocal(_map);

    // 🆕 Boş slot kontrolü
    const totalSchedules = (weekly.schedules || []).length;
    const actualLessons = (weekly.lessons || []).length;
    const emptyCount = totalSchedules - actualLessons;
    
    setEmptySlots(emptyCount);
    setShowAutoGenerate(emptyCount > 0);
  }

  useEffect(()=>{ refreshWeekly(); }, [start]);

  const maps = useMemo(()=>{
    const schedulesMap = new Map();
    (data.schedules||[]).forEach(s=>{
      const key = `${s.weekday}|${s.time}`;
      const arr = schedulesMap.get(key) || [];
      arr.push(s);
      schedulesMap.set(key, arr);
    });
    return { lessonsMap: lessonsMapLocal, schedulesMap };
  }, [lessonsMapLocal, data.schedules]);

  function daysArray(){
    const s = dayjs(start);
    return Array.from({length:7}, (_,i)=> s.add(i,"day"));
  }

  function setLessonStatusOptimistic(lesson, status){
    const dt = dayjs(lesson.startAt);
    const key = `${dt.format("YYYY-MM-DD")}|${dt.format("HH:mm")}`;
    const clone = new Map(lessonsMapLocal);
    clone.set(key, { ...lesson, status });
    setLessonsMapLocal(clone);
  }

  async function handleMarkDone(lessonId){
    try {
      setBusyId(lessonId);
      const l = [...lessonsMapLocal.values()].find(x=>x._id===lessonId);
      if (l) setLessonStatusOptimistic(l, "done");
      await Lessons.done(lessonId);
    } finally {
      setBusyId(null);
      await refreshWeekly();
    }
  }

  async function handleCancel(lessonId){
    try {
      setBusyId(lessonId);
      const l = [...lessonsMapLocal.values()].find(x=>x._id===lessonId);
      if (l) setLessonStatusOptimistic(l, "canceled");
      await Lessons.cancel(lessonId);
    } finally {
      setBusyId(null);
      await refreshWeekly();
    }
  }

  async function handleNoShow(lessonId){
    try {
      setBusyId(lessonId);
      const l = [...lessonsMapLocal.values()].find(x=>x._id===lessonId);
      if (l) setLessonStatusOptimistic(l, "no_show");
      await Lessons.noShow(lessonId);
    } finally {
      setBusyId(null);
      await refreshWeekly();
    }
  }

  async function handleRevert(lessonId){
    try {
      setBusyId(lessonId);
      const l = [...lessonsMapLocal.values()].find(x=>x._id===lessonId);
      if (l) setLessonStatusOptimistic(l, "planned");
      await Lessons.revert(lessonId);
    } finally {
      setBusyId(null);
      await refreshWeekly();
    }
  }

  // 🆕 Haftayı otomatik oluştur
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

  return (
    <div className="space-y-4">
      {/* 🆕 Uyarı mesajı */}
      {showAutoGenerate && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-amber-600 mt-0.5" size={20}/>
          <div className="flex-1">
            <div className="font-medium text-amber-900">Bu hafta {emptySlots} sabit plan için ders oluşturulmamış</div>
            <div className="text-sm text-amber-700 mt-1">
              Öğrencilerin sabit planları var ama dersler oluşturulmamış. "Haftayı Oluştur" butonuna basarak otomatik oluşturabilirsin.
            </div>
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
        
        {/* Manuel buton (her zaman görünür) */}
        <button
          onClick={handleAutoGenerate}
          className="ml-auto px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">
          Haftayı Oluştur
        </button>
      </div>

      {/* 7 sütun */}
      <div className="grid grid-cols-7 gap-3">
        {daysArray().map((d,i)=>(
          <div key={i} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="px-3 py-2 border-b text-sm font-semibold">
              {WEEKDAYS[i]} <span className="text-gray-500 font-normal">{d.format("DD.MM")}</span>
            </div>

            <div className="p-2 space-y-2">
              {DAY_SLOT_TIMES.map((time, idx)=>{
                const dateISO = d.format("YYYY-MM-DD");
                const key = `${dateISO}|${time}`;
                const lesson = maps.lessonsMap.get(key);

                if (!lesson) {
                  return (
                    <div key={idx} className="h-14 rounded-xl border border-dashed text-xs flex items-center justify-between px-2 text-gray-400">
                      <span>{time}</span>
                    </div>
                  );
                }

                const student = lesson.studentId;
                
                // 🆕 Öğrenci silinmişse bu slotu gösterme
                if (!student || !student._id) {
                  console.warn("⚠️ Orphan ders bulundu:", lesson);
                  return (
                    <div key={idx} className="h-14 rounded-xl border border-dashed text-xs flex items-center justify-between px-2 text-red-400">
                      <span>{time}</span>
                      <span className="text-xs">Silinmiş</span>
                    </div>
                  );
                }

                const statusStyle =
                  lesson.status === "done" ? "bg-emerald-50 border-emerald-200"
                : lesson.status === "no_show" ? "bg-rose-50 border-rose-200"
                : lesson.status === "canceled" ? "bg-gray-50 border-gray-200"
                : "bg-amber-50 border-amber-200";

                return (
                  <div key={idx}
                       className={`h-14 rounded-xl border ${statusStyle} text-sm flex items-center justify-between px-2`}>
                    <div className="truncate">
                      <div className="font-medium truncate">{student?.name || "Öğrenci"}</div>
                      <div className="text-xs text-gray-500">
                        {time} • {lesson.status === "no_show" ? "Gelmedi" : lesson.status === "done" ? "Yapıldı" : lesson.status === "canceled" ? "İptal" : "Planlı"}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {busyId === lesson._id ? (
                        <span className="inline-flex w-8 h-8 items-center justify-center">
                          <Loader2 className="animate-spin" size={16}/>
                        </span>
                      ) : lesson.status === "planned" ? (
                        <>
                          <IconBtn title="Yapıldı" onClick={()=>handleMarkDone(lesson._id)}><Check size={16}/></IconBtn>
                          <IconBtn title="İptal" onClick={()=>handleCancel(lesson._id)}><X size={16}/></IconBtn>
                          <IconBtn title="Gelmedi" onClick={()=>handleNoShow(lesson._id)}><Ban size={16}/></IconBtn>
                        </>
                      ) : (
                        <IconBtn title="Geri Al" onClick={()=>handleRevert(lesson._id)}><Undo2 size={16}/></IconBtn>
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
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg border bg-white hover:bg-gray-50 active:scale-95 transition">
      {children}
    </button>
  );
}