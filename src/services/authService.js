// src/services/authService.js
import api, { ACCESS_TOKEN_KEY } from "../api/axiosConfig";

export async function login(username, password) {
  const form = new URLSearchParams();
  form.set("grant_type", "password");
  form.set("username", username);
  form.set("password", password);

  const res = await api.post("/token", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const { access_token } = res.data || {};
  if (access_token) localStorage.setItem(ACCESS_TOKEN_KEY, access_token);
  return res.data;
}

export function logout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}
