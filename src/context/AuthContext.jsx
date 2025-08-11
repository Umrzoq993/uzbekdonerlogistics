import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axiosConfig";

const AuthCtx = createContext(null);
const TOKEN_KEY = "auth_token";
const EXP_KEY = "auth_exp";

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);

  // 🔄 Boshlang'ich yuklash (storage → state)
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY) || "";
    setToken(t);
    setReady(true);
  }, []);

  // axios header
  useEffect(() => {
    if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete api.defaults.headers.common.Authorization;
  }, [token]);

  const login = (accessToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);

    // JWT bo‘lsa exp ham saqlaymiz
    try {
      const payload = JSON.parse(atob(accessToken.split(".")[1] || ""));
      if (payload?.exp) {
        localStorage.setItem(EXP_KEY, String(payload.exp));
      }
    } catch {
      // ignore
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXP_KEY);
    setToken("");
  };

  const value = useMemo(
    () => ({ token, isAuthed: !!token, ready, login, logout }),
    [token, ready]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
