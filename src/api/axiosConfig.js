import axios from "axios";

const api = axios.create({
  baseURL: "https://uzbekdoner.adminsite.uz",
  timeout: 20000,
});

// Har bir so‘rovdan oldin storage’dan tokenni qo‘yib yuboramiz (fallback)
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
