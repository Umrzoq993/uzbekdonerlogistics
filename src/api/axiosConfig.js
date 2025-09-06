// src/api/axiosConfig.js
import axios from "axios";

const BASE_URL =
  (import.meta?.env?.VITE_API_BASE_URL ?? "").toString() ||
  "https://api.uzbekdoner.uz/";

export const ACCESS_TOKEN_KEY = "access_token";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

// Har requestga token qo‘shish
api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem(ACCESS_TOKEN_KEY) ||
    sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 -> logout + /login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
