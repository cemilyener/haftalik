export function calcLessonAccrual({ rateModel, lessonFee, hourFee, durationMin }) {
    if (rateModel === "monthly") return 0; // aylıkta ders bazında yazmıyoruz
    // Defne gibi 60 dk tek kalem sabitse:
    if (hourFee && durationMin >= 55 && durationMin <= 65) return -Math.abs(hourFee);
    // Orantı (40dk birim ücreti baz alınır)
    const unit = Number(lessonFee || 0);
    const factor = Math.round((durationMin / 40) * 100) / 100; 
    return -(unit * factor);
  }
  