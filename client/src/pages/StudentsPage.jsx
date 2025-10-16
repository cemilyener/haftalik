// src/pages/StudentsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Students, Schedules } from "../lib/api.js";

const WEEKDAYS = [
  { v:1, t:"Pazartesi" },{ v:2, t:"Salı" },{ v:3, t:"Çarşamba" },
  { v:4, t:"Perşembe" },{ v:5, t:"Cuma" },{ v:6, t:"Cumartesi" },{ v:7, t:"Pazar" },
];

const initialStudent = {
  accountType: "person",
  name: "",
  channel: "home",
  contacts: { parentName:"", phones:[""], email:"" },
  rateModel: "per_lesson",
  lessonFee: 500,
  hourFee: null,
  monthlyFee: null,
  monthlyBillingDay: null,
  notes: ""
};

export default function StudentsPage(){
  const [list, setList] = useState([]);
  const [form, setForm] = useState(initialStudent);
  const [editingId, setEditingId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // schedule state
  const [schedules, setSchedules] = useState([]);
  const [schForm, setSchForm] = useState({ weekday:1, time:"18:00", durationMin:40, location:"home", active:true });
  const [schEditing, setSchEditing] = useState(null);

  const selectedStudent = useMemo(()=>{
    return list.find(x=>x._id === selectedId) || null;
  }, [list, selectedId]);

  async function load(){
    const s = await Students.list();
    setList(s);
    if (selectedId) {
      const arr = await Schedules.listByStudent(selectedId);
      setSchedules(arr);
    }
  }

  useEffect(()=>{ load(); }, []);
  useEffect(()=>{
    if (!selectedId) { setSchedules([]); return; }
    Schedules.listByStudent(selectedId).then(setSchedules);
  }, [selectedId]);

  function updateContact(field, value){
    setForm(f=>({...f, contacts:{ ...(f.contacts||{}), [field]: value }}));
  }
  function updatePhone(index, value){
    const phones = [...(form.contacts?.phones||[])];
    phones[index] = value;
    updateContact("phones", phones);
  }
  function addPhone(){
    const phones = [...(form.contacts?.phones||[])];
    phones.push("");
    updateContact("phones", phones);
  }
  function removePhone(index){
    const phones = [...(form.contacts?.phones||[])];
    phones.splice(index,1);
    updateContact("phones", phones);
  }

  async function handleSubmit(e){
    e.preventDefault();
    // basit validasyon
    if (!form.name?.trim()) return alert("İsim zorunlu");
    if (!form.rateModel) return alert("Ücret modeli zorunlu");

    if (form.rateModel === "per_lesson" || form.rateModel === "hybrid") {
      if (form.lessonFee == null || form.lessonFee === "") return alert("40dk ders ücreti gerekli");
    }
    if (form.rateModel === "monthly") {
      if (!form.monthlyFee) return alert("Aylık ücret gerekli");
    }

    if (editingId) {
      await Students.update(editingId, form);
      setEditingId(null);
    } else {
      await Students.create(form);
    }
    setForm(initialStudent);
    await load();
  }

  async function editStudent(s){
    setEditingId(s._id);
    setForm({
      accountType: s.accountType || "person",
      name: s.name || "",
      channel: s.channel || "home",
      contacts: {
        parentName: s.contacts?.parentName || "",
        phones: (s.contacts?.phones && s.contacts.phones.length ? s.contacts.phones : [""]),
        email: s.contacts?.email || ""
      },
      rateModel: s.rateModel || "per_lesson",
      lessonFee: s.lessonFee ?? null,
      hourFee: s.hourFee ?? null,
      monthlyFee: s.monthlyFee ?? null,
      monthlyBillingDay: s.monthlyBillingDay ?? null,
      notes: s.notes || ""
    });
  }

  async function deleteStudent(id){
    if (!confirm("Öğrenciyi silmek istediğine emin misin?")) return;
    await Students.remove(id);
    if (selectedId === id) setSelectedId(null);
    await load();
  }

  // Schedules
  async function addSchedule(e){
    e.preventDefault();
    if (!selectedId) return alert("Önce bir öğrenci seç.");
    await Schedules.create({ ...schForm, studentId: selectedId });
    setSchForm({ weekday:1, time:"18:00", durationMin:40, location:"home", active:true });
    await Schedules.listByStudent(selectedId).then(setSchedules);
  }

  async function updateSchedule(e){
    e.preventDefault();
    if (!schEditing) return;
    await Schedules.update(schEditing._id, schForm);
    setSchEditing(null);
    setSchForm({ weekday:1, time:"18:00", durationMin:40, location:"home", active:true });
    await Schedules.listByStudent(selectedId).then(setSchedules);
  }

  function startEditSchedule(sch){
    setSchEditing(sch);
    setSchForm({
      weekday: sch.weekday,
      time: sch.time,
      durationMin: sch.durationMin,
      location: sch.location,
      active: sch.active
    });
  }

  async function removeSchedule(id){
    if (!confirm("Sabit plan kaydını silmek istediğine emin misin?")) return;
    await Schedules.remove(id);
    await Schedules.listByStudent(selectedId).then(setSchedules);
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* SOL: Öğrenci Formu */}
      <div className="bg-white border rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">{editingId ? "Öğrenciyi Düzenle" : "Yeni Öğrenci"}</h2>
          {editingId && (
            <button className="text-sm underline" onClick={()=>{ setEditingId(null); setForm(initialStudent); }}>
              Yeni kayıt moduna dön
            </button>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* temel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Hesap Tipi</label>
              <select className="w-full border rounded-lg px-3 py-2"
                value={form.accountType}
                onChange={e=>setForm(f=>({...f, accountType:e.target.value}))}>
                <option value="person">Kişi</option>
                <option value="organization">Kurum (Kulüp)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">Kanal</label>
              <select className="w-full border rounded-lg px-3 py-2"
                value={form.channel}
                onChange={e=>setForm(f=>({...f, channel:e.target.value}))}>
                <option value="home">Ev</option>
                <option value="online">Online</option>
                <option value="club">Kulüp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">Ad</label>
            <input className="w-full border rounded-lg px-3 py-2"
              value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} placeholder="Örn. Emir"/>
          </div>

          {/* iletişim */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Veli Adı</label>
              <input className="w-full border rounded-lg px-3 py-2"
                value={form.contacts?.parentName||""}
                onChange={e=>updateContact("parentName", e.target.value)} placeholder="Veli"/>
            </div>
            <div>
              <label className="text-xs text-gray-600">E-posta</label>
              <input className="w-full border rounded-lg px-3 py-2"
                value={form.contacts?.email||""}
                onChange={e=>updateContact("email", e.target.value)} placeholder="ornek@mail.com"/>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600">Telefonlar</label>
            <div className="space-y-2">
              {(form.contacts?.phones||[]).map((p,idx)=>(
                <div key={idx} className="flex gap-2">
                  <input className="flex-1 border rounded-lg px-3 py-2"
                    value={p} onChange={e=>updatePhone(idx, e.target.value)} placeholder="+90 ..."/>
                  <button type="button" className="px-2 border rounded-lg" onClick={()=>removePhone(idx)}>Sil</button>
                </div>
              ))}
              <button type="button" className="text-sm underline" onClick={addPhone}>+ Telefon ekle</button>
            </div>
          </div>

          {/* ücret modeli */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Ücret Modeli</label>
              <select className="w-full border rounded-lg px-3 py-2"
                value={form.rateModel}
                onChange={e=>setForm(f=>({...f, rateModel:e.target.value}))}>
                <option value="per_lesson">Ders başı</option>
                <option value="monthly">Aylık</option>
                <option value="hybrid">Avans + ders</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">40dk Ders Ücreti (TL)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2"
                value={form.lessonFee ?? ""} onChange={e=>setForm(f=>({...f, lessonFee:Number(e.target.value)}))} placeholder="örn. 1500"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">60dk Ücret (opsiyonel)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2"
                value={form.hourFee ?? ""} onChange={e=>setForm(f=>({...f, hourFee: e.target.value===""?null:Number(e.target.value)}))} placeholder="örn. 1000"/>
            </div>
            <div>
              <label className="text-xs text-gray-600">Aylık Ücret (monthly)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2"
                value={form.monthlyFee ?? ""} onChange={e=>setForm(f=>({...f, monthlyFee: e.target.value===""?null:Number(e.target.value)}))} placeholder="örn. 8000"/>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600">Fatura Günü (1..28)</label>
              <input type="number" className="w-full border rounded-lg px-3 py-2"
                value={form.monthlyBillingDay ?? ""} onChange={e=>setForm(f=>({...f, monthlyBillingDay: e.target.value===""?null:Number(e.target.value)}))} placeholder="örn. 24"/>
            </div>
            <div>
              <label className="text-xs text-gray-600">Notlar</label>
              <input className="w-full border rounded-lg px-3 py-2"
                value={form.notes} onChange={e=>setForm(f=>({...f, notes:e.target.value}))} placeholder="Not"/>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 rounded-lg bg-gray-900 text-white">
              {editingId ? "Güncelle" : "Ekle"}
            </button>
            {editingId && (
              <button type="button" className="px-4 py-2 rounded-lg border"
                onClick={()=>{ setEditingId(null); setForm(initialStudent); }}>
                İptal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* SAĞ: Öğrenci Listesi + Sabit Plan yönetimi */}
      <div className="space-y-6">
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Öğrenciler</h2>
          <ul className="divide-y">
            {list.map(s=>(
              <li key={s._id} className="py-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-xs text-gray-500 truncate">
                    {s.rateModel} • 40dk:{s.lessonFee ?? "-"} • aylık:{s.monthlyFee ?? "-"} • gün:{s.monthlyBillingDay ?? "-"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs px-2 py-1 border rounded"
                    onClick={()=>{ setSelectedId(s._id); }}>
                    Planlar
                  </button>
                  <button className="text-xs px-2 py-1 border rounded"
                    onClick={()=>editStudent(s)}>
                    Düzenle
                  </button>
                  <button className="text-xs px-2 py-1 border rounded"
                    onClick={()=>deleteStudent(s._id)}>
                    Sil
                  </button>
                </div>
              </li>
            ))}
            {list.length===0 && <li className="py-2 text-sm text-gray-500">Henüz öğrenci yok.</li>}
          </ul>
        </div>

        {/* Sabit Plan Yönetimi (seçili öğrenci) */}
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Sabit Plan (Seçili Öğrenci)</h2>
            <div className="text-sm text-gray-600">{selectedStudent?.name || "—"}</div>
          </div>

          {selectedId ? (
            <>
              <form onSubmit={schEditing ? updateSchedule : addSchedule} className="grid md:grid-cols-5 gap-2 mb-4">
                <select className="border rounded-lg px-3 py-2"
                  value={schForm.weekday}
                  onChange={e=>setSchForm(f=>({...f, weekday:Number(e.target.value)}))}>
                  {WEEKDAYS.map(w=><option key={w.v} value={w.v}>{w.t}</option>)}
                </select>
                <input className="border rounded-lg px-3 py-2" placeholder="HH:mm"
                  value={schForm.time} onChange={e=>setSchForm(f=>({...f,time:e.target.value}))}/>
                <select className="border rounded-lg px-3 py-2"
                  value={schForm.durationMin} onChange={e=>setSchForm(f=>({...f, durationMin:Number(e.target.value)}))}>
                  <option value={40}>40 dk</option>
                  <option value={60}>60 dk</option>
                  <option value={80}>80 dk</option>
                  <option value={90}>90 dk</option>
                </select>
                <select className="border rounded-lg px-3 py-2"
                  value={schForm.location} onChange={e=>setSchForm(f=>({...f, location:e.target.value}))}>
                  <option value="home">Ev</option>
                  <option value="online">Online</option>
                  <option value="club">Kulüp</option>
                </select>
                <div className="flex gap-2">
                  <button className="px-3 py-2 rounded-lg bg-gray-900 text-white">
                    {schEditing ? "Güncelle" : "Ekle"}
                  </button>
                  {schEditing && (
                    <button type="button" className="px-3 py-2 rounded-lg border"
                      onClick={()=>{ setSchEditing(null); setSchForm({ weekday:1,time:"18:00",durationMin:40,location:"home",active:true }); }}>
                      İptal
                    </button>
                  )}
                </div>
              </form>

              <ul className="divide-y">
                {schedules.map(sc=>(
                  <li key={sc._id} className="py-2 flex items-center justify-between">
                    <div className="text-sm">
                      {WEEKDAYS.find(w=>w.v===sc.weekday)?.t} • {sc.time} • {sc.durationMin} dk • {sc.location}
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs px-2 py-1 border rounded" onClick={()=>startEditSchedule(sc)}>Düzenle</button>
                      <button className="text-xs px-2 py-1 border rounded" onClick={()=>removeSchedule(sc._id)}>Sil</button>
                    </div>
                  </li>
                ))}
                {schedules.length===0 && <li className="py-2 text-sm text-gray-500">Bu öğrenci için sabit plan yok.</li>}
              </ul>
            </>
          ) : (
            <div className="text-sm text-gray-500">Sağdaki listeden bir öğrenci seç.</div>
          )}
        </div>
      </div>
    </div>
  );
}
