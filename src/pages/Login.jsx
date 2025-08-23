// src/pages/Login.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/uzbek-doner-logo.jpg";
import "./login.scss";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const { setToken, ready, isAuthed } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const from = state?.from?.pathname || "/";

  // Agar allaqachon tizimga kirgan bo‘lsa, /login sahifasida turib qolmasin
  useEffect(() => {
    if (ready && isAuthed) {
      navigate(from, { replace: true });
    }
  }, [ready, isAuthed, from, navigate]);

  // Autofill sync (brauzer auto-to‘ldirishini React state bilan uyg‘unlashtirish)
  useEffect(() => {
    const t = setTimeout(() => {
      const u = document.querySelector('input[name="username"]');
      const p = document.querySelector('input[name="password"]');
      if (u?.value) setUsername((s) => s || u.value);
      if (p?.value) setPassword((s) => s || p.value);
    }, 120);
    return () => clearTimeout(t);
  }, []);

  const onPasswordKey = (e) =>
    setCapsOn(e.getModifierState && e.getModifierState("CapsLock"));

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setErr("");
    setLoading(true);
    try {
      // FastAPI OAuth2 Password flow: x-www-form-urlencoded
      const form = new URLSearchParams();
      form.append("grant_type", "password");
      form.append("username", (username || "").trim());
      form.append("password", password || "");

      const { data } = await api.post("/token", form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // Token maydoni nomi turlicha bo‘lishi mumkin — ehtiyot chorasi:
      const token =
        data?.access_token ??
        data?.token ??
        data?.access ??
        data?.data?.access ??
        "";
      if (!token) {
        throw new Error("Access token topilmadi. Backend javobini tekshiring.");
      }

      // Tokenni saqlaymiz (localStorage + axios header)
      setToken(token);

      // Oldin kirishga uringan manzilga, bo‘lmasa "/" ga qaytaramiz
      navigate(from, { replace: true });
    } catch (e) {
      const s = e?.response?.status;
      let msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Kirishda kutilmagan xato yuz berdi";
      if (s === 400 || s === 401) msg = "Login yoki parol noto‘g‘ri.";
      if (s === 422) msg = "Maydonlar noto‘g‘ri (422).";
      if (s >= 500) msg = "Server xatosi. Birozdan so‘ng urinib ko‘ring.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-hero">
      <div className="glow g1" />
      <div className="glow g2" />
      <div className="grid-bg" aria-hidden="true" />

      <div className="card">
        {/* Brend panel (dekorativ) */}
        <aside className="brand-pane" aria-hidden="true">
          <div className="logo-wrap">
            <img src={logo} alt="Uzbek Doner" />
            <h1 className="brand-title">Uzbek Doner</h1>
            <p className="brand-tag">Admin Panel · Since 2023</p>
          </div>

          <ul className="selling-points">
            <li>⚡ Tez va ishonchli boshqaruv</li>
            <li>🗺️ Xaritada poligonlarni tahrirlash</li>
            <li>🚚 Kuryerlarni bir klikda biriktirish</li>
          </ul>

          <div className="mini-stats">
            <div className="pill">24/7</div>
            <div className="pill">27000+ buyurtma</div>
            <div className="pill">4 ta filial</div>
          </div>
        </aside>

        {/* Login forma */}
        <form className="form-pane" onSubmit={handleSubmit} autoComplete="on">
          <div className="title">Hisobga kirish</div>
          <p className="subtitle">
            Davom etish uchun login va parolni kiriting.
          </p>

          {err && <div className="alert error">{err}</div>}

          <label className="field">
            <span>Login</span>
            <input
              autoFocus
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              placeholder="masalan: sobirtb"
              required
            />
          </label>

          <label className="field">
            <span>Parol</span>
            <div className="pass">
              <input
                name="password"
                autoComplete="current-password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={onPasswordKey}
                onKeyDown={onPasswordKey}
                disabled={loading}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? "Parolni berkitish" : "Parolni ko‘rish"}
                tabIndex={-1}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            {capsOn && <div className="hint warn">Caps Lock yoqilgan</div>}
          </label>

          <div className="row row-aux">
            <div />
            <a href="#" onClick={(e) => e.preventDefault()} className="link">
              Parolni unutdingizmi?
            </a>
          </div>

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Kirish"}
          </button>

          <div className="foot">
            <span>© {new Date().getFullYear()} Uzbek Doner</span>
          </div>
        </form>
      </div>
    </div>
  );
}
