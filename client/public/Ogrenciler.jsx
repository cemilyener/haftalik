import React, { useState, useEffect } from "react";



// Modal bileşeni
function Modal({ isOpen, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

// Öğrenci kartı bileşeni
function StudentCard({ student, onEdit, onDelete }) {
  return (
    <li className="bg-white rounded-lg shadow p-4 flex justify-between items-center border border-gray-200">
      <div>
        <p className="font-semibold text-gray-800">
          {student.ad} {student.soyad}{" "}
          <span className="text-brand-600">({student.lichessNick || "—"})</span>
        </p>
        <p className="text-sm text-gray-500">Veli: {student.veliTel}</p>
        <p className="text-sm text-gray-500">Ücret: {student.aylikUcret}</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onEdit(student)}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
        >
          Güncelle
        </button>
        <button
          onClick={() => onDelete(student._id)}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
        >
          Sil
        </button>
      </div>
    </li>
  );
}
function Ogrenciler() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    ad: "",
    soyad: "",
    veliTel: "",
    lichessNick: "",
    aylikUcret: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  // Listeleme
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/students");
      const data = await res.json();
      setStudents(data);
    } catch (err) {
      console.error("Listeleme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  // Ekleme
  const addStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:3001/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          aylikUcret: Number(form.aylikUcret || 0),
        }),
      });
      if (!res.ok) throw new Error("Ekleme başarısız");
      setForm({ ad: "", soyad: "", veliTel: "", lichessNick: "", aylikUcret: "" });
      fetchStudents();
    } catch (err) {
      console.error(err);
    }
  };
    // Güncelleme
    const updateStudent = async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(`http://localhost:3001/students/${editStudent._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editStudent),
        });
        if (!res.ok) throw new Error("Güncelleme başarısız");
        setIsModalOpen(false);
        setEditStudent(null);
        fetchStudents();
      } catch (err) {
        console.error(err);
      }
    };
  
    // Silme
    const deleteStudent = async (id) => {
      try {
        const res = await fetch(`http://localhost:3001/students/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Silme başarısız");
        fetchStudents();
      } catch (err) {
        console.error(err);
      }
    };
  
    useEffect(() => {
      fetchStudents();
    }, []);
    return (
      <div className="min-h-screen bg-gray-100 text-gray-900">
      
  
        <main className="max-w-5xl mx-auto px-6 grid lg:grid-cols-3 gap-6 mt-6">
          {/* Form */}
          <section className="lg:col-span-1">
            <div className="bg-white rounded-lg p-5 shadow">
              <h2 className="text-xl font-semibold mb-4">Öğrenci Ekle</h2>
              <form className="space-y-4" onSubmit={addStudent}>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={form.ad}
                  onChange={(e) => setForm({ ...form, ad: e.target.value })}
                  placeholder="Ad"
                  required
                />
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={form.soyad}
                  onChange={(e) => setForm({ ...form, soyad: e.target.value })}
                  placeholder="Soyad"
                  required
                />
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={form.veliTel}
                  onChange={(e) => setForm({ ...form, veliTel: e.target.value })}
                  placeholder="Veli Telefon"
                  required
                />
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={form.lichessNick}
                  onChange={(e) => setForm({ ...form, lichessNick: e.target.value })}
                  placeholder="Lichess Nick"
                />
                <input
                  type="number"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={form.aylikUcret}
                  onChange={(e) => setForm({ ...form, aylikUcret: e.target.value })}
                  placeholder="Aylık Ücret"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 transition rounded px-4 py-2 font-medium text-white"
                >
                  Kaydet
                </button>
              </form>
            </div>
          </section>
  
          {/* Liste */}
          <section className="lg:col-span-2">
            <div className="bg-white rounded-lg p-5 shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Öğrenciler</h2>
                <button
                  onClick={fetchStudents}
                  className="bg-blue-600 hover:bg-blue-700 transition rounded px-4 py-2 font-medium text-white"
                >
                  Yenile
                </button>
              </div>
  
              {loading ? (
                <p className="text-gray-500">Yükleniyor...</p>
              ) : students.length === 0 ? (
                <p className="text-gray-500">Henüz öğrenci yok.</p>
              ) : (
                <ul className="space-y-3">
                  {students.map((s) => (
                    <StudentCard
                      key={s._id}
                      student={s}
                      onEdit={(st) => {
                        setEditStudent(st);
                        setIsModalOpen(true);
                      }}
                      onDelete={deleteStudent}
                      />
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </main>
    
          {/* Güncelleme Modalı */}
          <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <h2 className="text-xl font-semibold mb-4">Öğrenci Güncelle</h2>
            {editStudent && (
              <form className="space-y-4" onSubmit={updateStudent}>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={editStudent.ad}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, ad: e.target.value })
                  }
                  placeholder="Ad"
                  required
                />
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={editStudent.soyad}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, soyad: e.target.value })
                  }
                  placeholder="Soyad"
                  required
                />
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={editStudent.veliTel}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, veliTel: e.target.value })
                  }
                  placeholder="Veli Telefon"
                  required
                />
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={editStudent.lichessNick}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, lichessNick: e.target.value })
                  }
                  placeholder="Lichess Nick"
                />
                <input
                  type="number"
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={editStudent.aylikUcret}
                  onChange={(e) =>
                    setEditStudent({ ...editStudent, aylikUcret: e.target.value })
                  }
                  placeholder="Aylık Ücret"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                >
                  Kaydet
                </button>
              </form>
            )}
          </Modal>
        </div>
      );
    }
    
    export default Ogrenciler;
    
    