// src/pages/StudentsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Students, Schedules } from "../lib/api.js";
import MakeupLessonModal from "../components/MakeupLessonModal.jsx"; // Yeni eklenen import

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
  const [schForm, setSchForm] = useState({ 
    weekday:1, 
    time:"18:00",
    startTime:"18:00", // 🆕
    slotNumber: 5, // 🆕 Varsayılan Akşam 1
    durationMin:40, 
    location:"home", 
    active:true 
  });
  const [schEditing, setSchEditing] = useState(null);

  // ödeme modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  // 🆕 Transaction state
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);

  // 🆕 Telafi dersi modal state
  const [showMakeupModal, setShowMakeupModal] = useState(false);
  const [makeupForm, setMakeupForm] = useState({
    weekday: 1,
    slotNumber: 1,
    startTime: "14:00",
    durationMin: 40,
    endDate: "",
    paymentType: "prepaid" // prepaid, later
  });

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
    
    // 🔧 Yeni sistemde startTime ve slotNumber kullan
    await Schedules.create({ 
      studentId: selectedId,
      weekday: schForm.weekday,
      startTime: schForm.startTime, // ✅ startTime gönder
      slotNumber: schForm.slotNumber, // ✅ slotNumber gönder
      durationMin: schForm.durationMin,
      location: schForm.location,
      active: schForm.active
    });
    
    // Form'u sıfırla
    setSchForm({ 
      weekday: 1, 
      startTime: "18:00", // ✅ startTime
      slotNumber: 5, // ✅ slotNumber
      durationMin: 40, 
      location: "home", 
      active: true 
    });
    
    await Schedules.listByStudent(selectedId).then(setSchedules);
  }

  async function updateSchedule(e){
    e.preventDefault();
    if (!schEditing) return;
    
    // 🔧 Güncelleme yaparken de tüm alanları gönder
    await Schedules.update(schEditing._id, {
      weekday: schForm.weekday,
      startTime: schForm.startTime, // ✅ startTime gönder
      slotNumber: schForm.slotNumber, // ✅ slotNumber gönder
      durationMin: schForm.durationMin,
      location: schForm.location,
      active: schForm.active
    });
    
    setSchEditing(null);
    
    // Form'u sıfırla
    setSchForm({ 
      weekday: 1, 
      startTime: "18:00", // ✅ startTime
      slotNumber: 5, // ✅ slotNumber
      durationMin: 40, 
      location: "home", 
      active: true 
    });
    
    await Schedules.listByStudent(selectedId).then(setSchedules);
  }

  function startEditSchedule(sch){
    setSchEditing(sch);
    
    // 🔧 Schedule'dan gelen tüm alanları form'a yükle
    setSchForm({
      weekday: sch.weekday,
      startTime: sch.startTime || sch.time || "18:00", // ✅ startTime veya eski time
      slotNumber: sch.slotNumber || 5, // ✅ slotNumber
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

  // 🆕 Ödeme kaydet
  async function handlePayment(e){
    e.preventDefault();
    if (!selectedId) return alert("Önce bir öğrenci seç.");
    if (!paymentAmount || paymentAmount <= 0) return alert("Geçerli bir tutar girin");
    
    try {
      await Students.recordPayment(selectedId, {
        amount: Number(paymentAmount),
        note: paymentNote || "Ödeme alındı"
      });
      
      setPaymentAmount("");
      setPaymentNote("");
      setShowPaymentModal(false);
      await load();
      
      alert("✅ Ödeme kaydedildi!");
    } catch (err) {
      alert("❌ Hata: " + err.message);
    }
  }

  // 🆕 Transaction'ları yükle
  async function loadTransactions(studentId) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/transactions?studentId=${studentId}&limit=50`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.error("Transaction yükleme hatası:", err);
    }
  }

  // 🆕 Transaction sil
  async function deleteTransaction(txId) {
    if (!confirm("Bu işlemi silmek istediğine emin misin? Bakiye geri hesaplanacak.")) return;
    
    try {
      const token = localStorage.getItem("token");
      await fetch(`${import.meta.env.VITE_API_BASE}/transactions/${txId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      await loadTransactions(selectedId);
      await load(); // Öğrenci listesini yenile (bakiye güncellensin)
      alert("✅ İşlem silindi!");
    } catch (err) {
      alert("❌ Hata: " + err.message);
    }
  }

  // Öğrenci seçildiğinde transaction'ları yükle
  useEffect(() => {
    if (selectedId) {
      loadTransactions(selectedId);
    } else {
      setTransactions([]);
    }
  }, [selectedId]);

  const handleMakeupLesson = async (studentId) => {
    setShowMakeupModal(true);
  };

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

      {/* SAĞ: Öğrenci Detayları */}
      <div className="space-y-4">
        {/* Öğrenci Listesi */}
        <div className="bg-white border rounded-xl p-4">
          <h2 className="font-semibold mb-3">Öğrenciler</h2>
          <div className="space-y-2 max-h-96 overflow-auto">
          {list.map(s=>(
            <div key={s._id}
                 className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                   selectedId === s._id ? "bg-gray-100 ring-1 ring-gray-300" : ""
                 }`}
                 onClick={()=>setSelectedId(s._id)}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-gray-500">
                    {s.rateModel === "monthly" && `${s.monthlyFee} TL/ay`}
                    {s.rateModel === "per_lesson" && `${s.lessonFee} TL/ders`}
                    {s.rateModel === "hybrid" && `Hybrid`}
                  </div>
                  {/* 🆕 Bakiye göster */}
                  {s.balance !== undefined && (
                    <div className={`text-sm font-medium mt-1 ${
                      s.balance > 0 ? 'text-green-600' : 
                      s.balance < 0 ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      Bakiye: {s.balance > 0 ? '+' : ''}{s.balance} TL
                    </div>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={(e)=>{ e.stopPropagation(); editStudent(s); }}>
                    Düzenle
                  </button>
                  {/* 🆕 Ödeme butonu */}
                  <button
                    className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                    onClick={(e)=>{ 
                      e.stopPropagation(); 
                      setSelectedId(s._id);
                      setShowPaymentModal(true);
                    }}>
                    Ödeme Al
                  </button>
                  <button
                    className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                    onClick={(e)=>{ e.stopPropagation(); deleteStudent(s._id); }}>
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* 🆕 SEÇİLİ ÖĞRENCİ DETAYLARI */}
        {selectedStudent && (
          <div className="bg-white border rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{selectedStudent.name} - Detaylar</h3>
              <button
                onClick={() => setShowTransactions(!showTransactions)}
                className="text-sm text-blue-600 hover:underline">
                {showTransactions ? "Gizle" : "İşlem Geçmişini Göster"}
              </button>
            </div>

            {/* Bakiye Özeti */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Bakiye</div>
                <div className={`text-xl font-bold ${
                  selectedStudent.balance > 0 ? 'text-green-600' : 
                  selectedStudent.balance < 0 ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {selectedStudent.balance > 0 ? '+' : ''}{selectedStudent.balance || 0} TL
                </div>
              </div>
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-600">Sonraki Ödeme</div>
                <div className="text-sm font-medium">
                  {selectedStudent.nextPaymentDue 
                    ? new Date(selectedStudent.nextPaymentDue).toLocaleDateString("tr-TR")
                    : "-"}
                </div>
              </div>
            </div>

            {/* 🆕 İŞLEM GEÇMİŞİ */}
            {showTransactions && (
              <div className="border-t pt-3">
                <h4 className="text-sm font-semibold mb-2">İşlem Geçmişi ({transactions.length})</h4>
                {transactions.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">Henüz işlem yok</div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {transactions.map(tx => (
                      <div key={tx._id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              tx.type === 'payment' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {tx.type === 'payment' ? '💵 Ödeme' : '📚 Ders'}
                            </span>
                            <span className={`text-base font-bold ${
                              tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount} TL
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(tx.date).toLocaleDateString("tr-TR", {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {tx.note && ` • ${tx.note}`}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteTransaction(tx._id)}
                          className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200">
                          Sil
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hızlı İşlemler */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => handleMakeupLesson(selectedStudent._id)}
                className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm">
                📚 Telafi Dersi Ekle
              </button>
              <button
                onClick={() => handleExtraLesson(selectedStudent._id)}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm">
                ➕ Ek Ders Ekle
              </button>
            </div>

            {/* Sabit Program Listesi (Mevcut kod) */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Sabit Program</h4>
              <div className="space-y-2">
                {schedules.length === 0 && (
                  <div className="text-sm text-gray-500 text-center py-2">Bu öğrenci için sabit program yok.</div>
                )}
                {schedules.map(sc=>(
                  <div key={sc._id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                    <div className="text-sm">
                      {/* 🔧 startTime ve slotNumber göster */}
                      {WEEKDAYS.find(w=>w.v===sc.weekday)?.t} 
                      {sc.slotNumber && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Slot {sc.slotNumber}</span>}
                      {" • "}
                      {sc.startTime || sc.time} 
                      {" • "}
                      {sc.durationMin} dk 
                      {" • "}
                      {sc.location}
                      {sc.lessonType && sc.lessonType !== "regular" && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                          {sc.lessonType === "makeup" ? "Telafi" : "Ekstra"}
                        </span>
                      )}
                      {sc.endDate && (
                        <span className="ml-2 text-xs text-gray-500">
                          (Bitiş: {new Date(sc.endDate).toLocaleDateString("tr-TR")})
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs px-2 py-1 border rounded hover:bg-gray-100" onClick={()=>startEditSchedule(sc)}>Düzenle</button>
                      <button className="text-xs px-2 py-1 border rounded hover:bg-red-50 hover:text-red-600" onClick={()=>removeSchedule(sc._id)}>Sil</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 🆕 SABİT PROGRAM EKLEME FORMU */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold mb-3">
                {schEditing ? "Programı Düzenle" : "Yeni Sabit Program Ekle"}
              </h4>
              <form onSubmit={schEditing ? updateSchedule : addSchedule} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Gün</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={schForm.weekday}
                      onChange={e=>setSchForm(f=>({...f, weekday: Number(e.target.value)}))}>
                      {WEEKDAYS.map(w => (
                        <option key={w.v} value={w.v}>{w.t}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 🆕 Slot seçimi */}
                  <div>
                    <label className="text-xs text-gray-600">Slot</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={schForm.slotNumber || 1}
                      onChange={e=>setSchForm(f=>({...f, slotNumber: Number(e.target.value)}))}>
                      <option value={1}>Slot 1 - Sabah 1</option>
                      <option value={2}>Slot 2 - Sabah 2</option>
                      <option value={3}>Slot 3 - Öğle</option>
                      <option value={4}>Slot 4 - Öğleden Sonra</option>
                      <option value={5}>Slot 5 - Akşam 1</option>
                      <option value={6}>Slot 6 - Akşam 2</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600">Başlama Saati</label>
                    <input
                      type="time"
                      className="w-full border rounded-lg px-3 py-2"
                      value={schForm.startTime || "18:00"}
                      onChange={e=>setSchForm(f=>({...f, startTime: e.target.value}))}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600">Süre (dakika)</label>
                    <input
                      type="number"
                      className="w-full border rounded-lg px-3 py-2"
                      value={schForm.durationMin}
                      onChange={e=>setSchForm(f=>({...f, durationMin: Number(e.target.value)}))}
                      placeholder="40"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Yer</label>
                    <select
                      className="w-full border rounded-lg px-3 py-2"
                      value={schForm.location}
                      onChange={e=>setSchForm(f=>({...f, location: e.target.value}))}>
                      <option value="home">Ev</option>
                      <option value="online">Online</option>
                      <option value="club">Kulüp</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    {schEditing ? "Güncelle" : "Ekle"}
                  </button>
                  {schEditing && (
                    <button
                      type="button"
                      onClick={() => {
                        setSchEditing(null);
                        setSchForm({ 
                          weekday: 1, 
                          startTime: "18:00", 
                          slotNumber: 5, 
                          durationMin: 40, 
                          location: "home", 
                          active: true 
                        });
                      }}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                      İptal
                    </button>
                  )}
                </div>
              </form>
            </div>

          </div>
        )}
      </div>

      {/* Ödeme Modal (Mevcut kod) */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
             onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4"
               onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">
              💰 Ödeme Al - {selectedStudent?.name}
            </h3>
            
            {selectedStudent && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Mevcut Bakiye</div>
                <div className={`text-2xl font-bold ${
                  selectedStudent.balance > 0 ? 'text-green-600' : 
                  selectedStudent.balance < 0 ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {selectedStudent.balance > 0 ? '+' : ''}{selectedStudent.balance || 0} TL
                </div>
              </div>
            )}
            
            <form onSubmit={handlePayment} className="space-y-3">
              <div>
                <label className="text-sm text-gray-600">Ödeme Tutarı (TL)</label>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Örn: 6000"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Not (Opsiyonel)</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Örn: Ekim ayı ödemesi"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Ödemeyi Kaydet
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🆕 Telafi dersi modal render */}
      {showMakeupModal && (
        <MakeupLessonModal
          student={selectedStudent}
          onClose={() => setShowMakeupModal(false)}
          onSave={async (data) => {
            // Geçici schedule oluştur
            await Schedules.create({
              studentId: selectedStudent._id,
              weekday: data.weekday,
              slotNumber: data.slotNumber,
              startTime: data.startTime,
              durationMin: data.durationMin,
              lessonType: "makeup",
              endDate: data.endDate,
              active: true
            });
            
            // Ücret peşin alındıysa bakiye güncelle
            if (data.paymentType === "prepaid" && data.amount) {
              await Students.recordPayment(selectedStudent._id, {
                amount: data.amount,
                note: "Telafi dersi peşin ödeme"
              });
            }
            
            setShowMakeupModal(false);
            await load();
            alert("✅ Telafi dersi eklendi!");
          }}
        />
      )}
    </div>
  );
}
