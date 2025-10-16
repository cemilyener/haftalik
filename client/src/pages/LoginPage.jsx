// src/pages/LoginPage.jsx
import { useState } from "react";
import axios from "axios";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_BASE}/auth/login`, { email, password });
      localStorage.setItem("token", res.data.token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${res.data.token}`;
      onLogin();
    } catch {
      setError("Hatalı e-posta veya şifre");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl border shadow-sm w-80 space-y-4">
        <h1 className="font-semibold text-lg text-center">Haftalık Giriş</h1>
        <input
          type="email"
          placeholder="E-posta"
          autoComplete="email"
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        <input
          type="password"
          placeholder="Şifre"
          autoComplete="current-password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800">
          Giriş Yap
        </button>
      </form>
    </div>
  );
}
