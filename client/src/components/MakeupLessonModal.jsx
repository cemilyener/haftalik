import { useState } from "react";

const WEEKDAYS = [
  { v: 1, t: "Pazartesi" },
  { v: 2, t: "Salı" },
  { v: 3, t: "Çarşamba" },
  { v: 4, t: "Perşembe" },
  { v: 5, t: "Cuma" },
  { v: 6, t: "Cumartesi" },
  { v: 7, t: "Pazar" },
];

const SLOTS = [
  { value: 1, label: "Sabah 1 (08:00-12:00)" },
  { value: 2, label: "Sabah 2 (08:00-12:00)" },
  { value: 3, label: "Öğle (12:00-14:00)" },
  { value: 4, label: "Öğleden Sonra (14:00-17:00)" },
  { value: 5, label: "Akşam 1 (17:00-21:00)" },
  { value: 6, label: "Akşam 2 (17:00-21:00)" },
];

export default function MakeupLessonModal({ student, onClose, onSave }) {
  const [form, setForm] = useState({
    weekday: 1,
    slotNumber: 5,
    startTime: "18:00",
    durationMin: 40,
    endDate: "",
    paymentType: "later", // prepaid or later
    amount: 0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.endDate) {
      alert("⚠️ Lütfen bitiş tarihi girin!");
      return;
    }

    if (form.paymentType === "prepaid" && (!form.amount || form.amount <= 0)) {
      alert("⚠️ Peşin ödeme seçildi ama tutar girilmedi!");
      return;
    }

    onSave(form);
  };

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          padding: "24px",
          width: "90%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: "20px" }}>
          🔄 Telafi Dersi Ekle - {student?.name}
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Gün */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>
              Gün:
            </label>
            <select
              value={form.weekday}
              onChange={(e) => updateForm("weekday", Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
              required
            >
              {WEEKDAYS.map((wd) => (
                <option key={wd.v} value={wd.v}>
                  {wd.t}
                </option>
              ))}
            </select>
          </div>

          {/* Slot */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>
              Zaman Dilimi (Slot):
            </label>
            <select
              value={form.slotNumber}
              onChange={(e) => updateForm("slotNumber", Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
              required
            >
              {SLOTS.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  Slot {slot.value} - {slot.label}
                </option>
              ))}
            </select>
          </div>

          {/* Başlangıç Saati */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>
              Başlangıç Saati:
            </label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => updateForm("startTime", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
              required
            />
          </div>

          {/* Süre */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>
              Ders Süresi (dakika):
            </label>
            <input
              type="number"
              value={form.durationMin}
              onChange={(e) => updateForm("durationMin", Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
              min="20"
              max="180"
              required
            />
          </div>

          {/* Bitiş Tarihi */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>
              Bitiş Tarihi:
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => updateForm("endDate", e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                border: "1px solid #ddd",
                borderRadius: "4px",
              }}
              required
            />
            <small style={{ color: "#666" }}>
              Bu tarihten sonra telafi dersi otomatik olarak planlanmayacak
            </small>
          </div>

          {/* Ödeme Tipi */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>
              Ödeme:
            </label>
            <div style={{ display: "flex", gap: "16px" }}>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="paymentType"
                  value="later"
                  checked={form.paymentType === "later"}
                  onChange={(e) => updateForm("paymentType", e.target.value)}
                  style={{ marginRight: "6px" }}
                />
                Sonra ödenecek
              </label>
              <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="paymentType"
                  value="prepaid"
                  checked={form.paymentType === "prepaid"}
                  onChange={(e) => updateForm("paymentType", e.target.value)}
                  style={{ marginRight: "6px" }}
                />
                Peşin ödendi
              </label>
            </div>
          </div>

          {/* Peşin Ödeme Tutarı */}
          {form.paymentType === "prepaid" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontWeight: 600 }}>
                Ödeme Tutarı (TL):
              </label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => updateForm("amount", Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
                min="0"
                step="0.01"
                required
              />
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#4CAF50",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ✅ Kaydet
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "10px",
                backgroundColor: "#f44336",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              ❌ İptal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}