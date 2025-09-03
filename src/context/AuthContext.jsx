// src/context/AuthContext.jsx
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import api, { ACCESS_TOKEN_KEY } from "../api/axiosConfig";

const AuthCtx = createContext(null);

/**
 * AuthProvider: tokenni localStorage bilan sinxronlaydi,
 * axios.default Authorization header'ini boshqaradi,
 * va "ready" flagi orqali ProtectedRoute ga to‘g‘ri ketma-ketlikni beradi.
 */
export function AuthProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [token, setTokenState] = useState("");

  // Ilk yuklanishda tokenni localStorage'dan o‘qiymiz
  useEffect(() => {
    const t = localStorage.getItem(ACCESS_TOKEN_KEY) || "";
    setTokenState(t);
    setReady(true);
  }, []);

  // Token o‘zgarsa — axios header'ini yangilaymiz
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  const isAuthed = !!token;

  // localStorage + state sinxron
  const setToken = useCallback((t) => {
    if (t) localStorage.setItem(ACCESS_TOKEN_KEY, t);
    else localStorage.removeItem(ACCESS_TOKEN_KEY);
    setTokenState(t || "");
  }, []);

  const logout = useCallback(() => setToken(""), [setToken]);

  const value = useMemo(
    () => ({ ready, isAuthed, setToken, logout }),
    [ready, isAuthed, setToken, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
