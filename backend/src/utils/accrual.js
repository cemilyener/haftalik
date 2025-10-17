// backend/src/utils/accrual.js

export function calcLessonAccrual({ rateModel, lessonFee, hourFee, durationMin }) {
  try {
    // 🔧 FIX 1: Güvenli varsayılanlar
    const model = rateModel || "per_lesson";
    const duration = Number(durationMin) || 40;
    
    // Aylık modelde ders bazlı tahakkuk yok
    if (model === "monthly") {
      console.log("📊 Aylık model - ders tahakkuku yok");
      return 0;
    }
    
    // 60 dakikalık özel fiyat varsa
    if (hourFee && duration >= 55 && duration <= 65) {
      const amount = -Math.abs(Number(hourFee));
      console.log(`📊 60dk sabit ücret: ${amount} TL`);
      return amount;
    }
    
    // Ders bazlı hesaplama (40dk bazında orantılı)
    const unit = Number(lessonFee) || 0;
    if (unit === 0) {
      console.log("⚠️ Ders ücreti 0, tahakkuk yok");
      return 0;
    }
    
    const factor = Math.round((duration / 40) * 100) / 100;
    const amount = -(unit * factor);
    
    console.log(`📊 Tahakkuk: ${duration}dk × ${unit} TL = ${amount} TL (factor: ${factor})`);
    return amount;
    
  } catch (error) {
    console.error("❌ Tahakkuk hesaplama hatası:", error);
    return 0; // Hata durumunda 0 döndür
  }
}