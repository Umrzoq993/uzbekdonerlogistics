// api/axiosConfig.js
import axios from "axios";

let onUnauthorized = null;
export function registerUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

const api = axios.create({
  baseURL: "https://uzbekdoner.adminsite.uz",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ⛔️ 401/403 bo‘lsa — avtomatik logout
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      try {
        onUnauthorized?.(error);
      } finally {
        // fallback: agar handler ro‘yxatdan o‘tmagan bo‘lsa ham tozalab yuboramiz
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_exp");
        // login sahifangiz boshqacha bo‘lsa shu yo‘lni moslang
        if (window.location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
