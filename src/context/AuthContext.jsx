// context/AuthProvider.jsx (yoki shu fayl)
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import api, { registerUnauthorizedHandler } from "../api/axiosConfig";

const AuthCtx = createContext(null);
const TOKEN_KEY = "auth_token";
const EXP_KEY = "auth_exp";

export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const logoutTimer = useRef(null);
  const loggingOut = useRef(false);

  const clearLogoutTimer = () => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
  };

  const logout = useCallback(() => {
    if (loggingOut.current) return;
    loggingOut.current = true;
    clearLogoutTimer();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXP_KEY);
    setToken("");
    // login sahifangiz boshqacha bo‘lsa moslang
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
    setTimeout(() => (loggingOut.current = false), 500); // debouncing
  }, []);

  // ⏱ exp bo‘yicha avtomatik logout
  const scheduleAutoLogout = useCallback(
    (expSec) => {
      clearLogoutTimer();
      const exp = Number(expSec);
      if (!Number.isFinite(exp) || exp <= 0) return;
      const msLeft = exp * 1000 - Date.now();
      if (msLeft <= 0) {
        logout();
        return;
      }
      // 5s oldin
      logoutTimer.current = setTimeout(logout, Math.max(0, msLeft - 5000));
    },
    [logout]
  );

  // 🔄 Boshlang‘ich yuklash
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY) || "";
    setToken(t);
    const exp = localStorage.getItem(EXP_KEY);
    if (t && exp) scheduleAutoLogout(Number(exp));
    setReady(true);
  }, [scheduleAutoLogout]);

  // axios header (avvalgidek)
  useEffect(() => {
    if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete api.defaults.headers.common.Authorization;
  }, [token]);

  // 🔐 Login
  const login = useCallback(
    (accessToken) => {
      localStorage.setItem(TOKEN_KEY, accessToken);
      setToken(accessToken);

      // JWT exp ni saqlash va timer qo‘yish
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1] || ""));
        if (payload?.exp) {
          localStorage.setItem(EXP_KEY, String(payload.exp));
          scheduleAutoLogout(payload.exp);
        } else {
          localStorage.removeItem(EXP_KEY);
          clearLogoutTimer();
        }
      } catch {
        localStorage.removeItem(EXP_KEY);
        clearLogoutTimer();
      }
    },
    [scheduleAutoLogout]
  );

  // 🔔 401/403 holatlarida axios’dan keladigan signalni tutish
  useEffect(() => {
    registerUnauthorizedHandler(() => logout());
  }, [logout]);

  // 🪟 Boshqa tablarda logout bo‘lsa — sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY && !e.newValue) logout();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [logout]);

  const value = useMemo(
    () => ({ token, isAuthed: !!token, ready, login, logout }),
    [token, ready, login, logout]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
