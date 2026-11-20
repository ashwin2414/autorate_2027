import { io } from "socket.io-client";

// Talks to the Express backend through the Vite proxy (/api -> http://localhost:5000).
const BASE = import.meta.env.VITE_API_URL || "/api";
export const realtime = io();

export const getToken = () => localStorage.getItem("autorate_token");
export const getUser = () => {
  try { return JSON.parse(localStorage.getItem("autorate_user")); } catch { return null; }
};
export const saveSession = ({ token, user }) => {
  localStorage.setItem("autorate_token", token);
  localStorage.setItem("autorate_user", JSON.stringify(user));
};
export const logout = () => {
  localStorage.removeItem("autorate_token");
  localStorage.removeItem("autorate_user");
};

async function request(path, { method = "GET", body } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.message || `Request failed (${res.status})`);
  if (data === null) throw new Error("The server returned an invalid response");
  return data;
}

const qs = (o = {}) => {
  const s = new URLSearchParams(Object.entries(o).filter(([, v]) => v !== "" && v != null)).toString();
  return s ? `?${s}` : "";
};

export const api = {
  register: async (name, email, password, username) => { const d = await request("/auth/register", { method: "POST", body: { name, email, password, username } }); saveSession(d); return d; },
  login: async (login, password) => { const d = await request("/auth/login", { method: "POST", body: { login, password } }); saveSession(d); return d; },
  adminLogin: async (login, password) => { const d = await request("/auth/admin/login", { method: "POST", body: { login, password } }); saveSession(d); return d; },
  me: () => request("/auth/me"),
  cars: (filters) => request(`/cars${qs(filters)}`),
  carFilters: () => request("/cars/meta/filters"),
  car: (id) => request(`/cars/${id}`),
  reviews: (params) => request(`/reviews${qs(params)}`),
  addReview: (review) => request("/reviews", { method: "POST", body: review }),
  updateReview: (id, review) => request(`/reviews/${id}`, { method: "PUT", body: review }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: "DELETE" }),
  contact: (form) => request("/contact", { method: "POST", body: form }),
  faqs: () => request("/faqs"),
  admin: {
    stats: () => request("/admin/stats"),
    profile: () => request("/admin/profile"),
    updateProfile: (body) => request("/admin/profile", { method: "PUT", body }),
    changePassword: (body) => request("/admin/password", { method: "PUT", body }),
    admins: () => request("/admin/admins"),
    addAdmin: (body) => request("/admin/admins", { method: "POST", body }),
    deleteAdmin: (id) => request(`/admin/admins/${id}`, { method: "DELETE" }),
    users: () => request("/admin/users"),
    deleteUser: (id) => request(`/admin/users/${id}`, { method: "DELETE" }),
    addCar: (car) => request("/admin/cars", { method: "POST", body: car }),
    findCarImage: (name, wiki) => request("/admin/cars/image", { method: "POST", body: { name, wiki } }),
    updateCar: (id, car) => request(`/admin/cars/${id}`, { method: "PUT", body: car }),
    deleteCar: (id) => request(`/admin/cars/${id}`, { method: "DELETE" }),
    messages: () => request("/admin/messages"),
    deleteMessage: (id) => request(`/admin/messages/${id}`, { method: "DELETE" }),
  },
};
