// client/src/lib/api.js
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

// Tek axios instance
const api = axios.create({ baseURL: API_BASE });

// Her isteğe otomatik Authorization başlığı ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------- ENDPOINT SARMALAYICILARI ----------

export const Auth = {
  login: (email, password) => api.post("/auth/login", { email, password }).then(r=>r.data),
};

export const Students = {
  list: () => api.get("/students").then(r=>r.data),
  create: (payload) => api.post("/students", payload).then(r=>r.data),
  update: (id, payload) => api.put(`/students/${id}`, payload).then(r=>r.data),
  remove: (id) => api.delete(`/students/${id}`).then(r=>r.data),
};

export const Schedules = {
  // 🔹 TÜM LİSTE
  list: () => api.get("/schedules").then(r=>r.data),
  // 🔹 ÖĞRENCİYE GÖRE LİSTE (EKSİK OLAN FONKSİYON)
  listByStudent: (studentId) => api.get(`/schedules`, { params: { studentId } }).then(r=>r.data),
  create: (payload) => api.post(`/schedules`, payload).then(r=>r.data),
  update: (id, payload) => api.put(`/schedules/${id}`, payload).then(r=>r.data),
  remove: (id) => api.delete(`/schedules/${id}`).then(r=>r.data),
};

export const Lessons = {
  done: (id) => api.post(`/lessons/${id}/done`).then(r=>r.data),
  cancel: (id) => api.post(`/lessons/${id}/cancel`).then(r=>r.data),
  noShow: (id) => api.post(`/lessons/${id}/no-show`).then(r=>r.data),
  revert: (id) => api.post(`/lessons/${id}/revert`).then(r=>r.data),
};

export const Weekly = {
  get: (startISO) => api.get(`/weekly?start=${startISO}`).then(r=>r.data),
};

export const Reports = {
  monthly: (ym) => api.get(`/reports/monthly?month=${ym}`).then(r=>r.data),
};
