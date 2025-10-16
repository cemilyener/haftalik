import axios from "axios";

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:3001",
  headers: { "Content-Type": "application/json" }
});

// STUDENTS
export const Students = {
  list: () => API.get("/students").then(r=>r.data),
  create: (payload) => API.post("/students", payload).then(r=>r.data),
  update: (id, payload) => API.put(`/students/${id}`, payload).then(r=>r.data),
  remove: (id) => API.delete(`/students/${id}`).then(r=>r.data),
  balance: (id) => API.get(`/students/${id}/balance`).then(r=>r.data),
};

// SCHEDULES
export const Schedules = {
  listByStudent: (studentId) => API.get("/schedules").then(r=>{
    const all = r.data || [];
    return all.filter(s=> (s.studentId?._id || s.studentId) === studentId);
  }),
  create: (payload) => API.post("/schedules", payload).then(r=>r.data),
  update: (id, payload) => API.put(`/schedules/${id}`, payload).then(r=>r.data),
  remove: (id) => API.delete(`/schedules/${id}`).then(r=>r.data),
};

// LESSONS
export const Lessons = {
  list: (params={}) => API.get("/lessons", { params }).then(r=>r.data),
  create: (payload) => API.post("/lessons", payload).then(r=>r.data),
  update: (id, payload) => API.put(`/lessons/${id}`, payload).then(r=>r.data),
  remove: (id) => API.delete ? API.delete(`/lessons/${id}`).then(r=>r.data) : Promise.resolve(),
  done: (id) => API.post(`/lessons/${id}/done`).then(r=>r.data),
  cancel: (id) => API.post(`/lessons/${id}/cancel`).then(r=>r.data),
  noShow: (id) => API.post(`/lessons/${id}/no-show`).then(r=>r.data),
  makeup: (id, payload) => API.post(`/lessons/${id}/makeup`, payload).then(r=>r.data),
  // ⬇️ yeni
  revert: (id) => API.post(`/lessons/${id}/revert`).then(r=>r.data),
};

// TRANSACTIONS
export const Transactions = {
  list: (params={}) => API.get("/transactions", { params }).then(r=>r.data),
  create: (payload) => API.post("/transactions", payload).then(r=>r.data),
};

// WEEKLY
export const Weekly = {
  get: (start) => API.get("/weekly", { params: { start } }).then(r=>r.data),
};

// REPORTS
export const Reports = {
  monthly: (month /* 'YYYY-MM' | undefined */) =>
    API.get("/reports/monthly", { params: month ? { month } : {} }).then(r=>r.data),
};
