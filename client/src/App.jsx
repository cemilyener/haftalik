// src/App.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";

import WeeklyPage from "./pages/WeeklyPage.jsx";
import StudentsPage from "./pages/StudentsPage.jsx";
import PaymentsPage from "./pages/PaymentsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, [token]);

  // Login yoksa sadece login sayfası göster
  if (!token)
    return <LoginPage onLogin={() => setToken(localStorage.getItem("token"))} />;

  // Giriş yapılmışsa ana uygulama
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <header className="sticky top-0 bg-white border-b z-10">
          <div className="max-w-7xl mx-auto px-5 py-3 flex justify-between items-center">
            <nav className="flex gap-3 text-sm">
              <NavLink to="/" className="px-3 py-2 rounded-md hover:bg-gray-100">Haftalık</NavLink>
              <NavLink to="/students" className="px-3 py-2 rounded-md hover:bg-gray-100">Öğrenciler</NavLink>
              <NavLink to="/payments" className="px-3 py-2 rounded-md hover:bg-gray-100">Ödemeler</NavLink>
            </nav>
            <button
              onClick={() => {
                localStorage.removeItem("token");
                window.location.reload();
              }}
              className="text-sm text-gray-500 hover:text-gray-800"
            >
              Çıkış
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-5 py-6">
          <Routes>
            <Route path="/" element={<WeeklyPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
