import { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { createUser } from "../services/usersService";
import "./create-user-modal.scss";

export default function CreateUserModal({ open, onClose, onSuccess }) {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName("");
      setUsername("");
      setPassword("");
      setShowPass(false);
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const canSubmit =
    (fullName || "").trim().length >= 2 &&
    (username || "").trim().length >= 3 &&
    (password || "").length >= 6 &&
    !loading;

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        username: username.trim(),
        password,
      };
      await createUser(payload);
      toast.success("Foydalanuvchi yaratildi ✓");
      onSuccess?.();
      onClose?.();
    } catch (e) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Foydalanuvchini yaratib bo‘lmadi";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className="cu-modal-backdrop" onMouseDown={onBackdrop}>
      <div
        className="cu-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cu-header">
          <div id="create-user-title" className="cu-title">
            Foydalanuvchi yaratish
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish">
            <X size={18} />
          </button>
        </div>

        <form className="cu-body" onSubmit={handleSubmit}>
          <label className="field">
            <span>To‘liq ism</span>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Masalan: Sobitjon Mirahmedov"
              autoFocus
              required
            />
          </label>

          <label className="field">
            <span>Login</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masalan: sobirtb"
              required
            />
          </label>

          <label className="field">
            <span>Parol</span>
            <div className="pass">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 ta belgi"
                required
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? "Parolni berkitish" : "Parolni ko‘rish"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="hint">Kamida 6 ta belgi bo‘lishi kerak.</div>
          </label>

          <div className="cu-footer">
            <button type="button" className="btn" onClick={onClose}>
              Bekor qilish
            </button>
            <button
              type="submit"
              className="btn primary"
              disabled={!canSubmit}
              title={
                !canSubmit ? "Maydonlarni to‘liq va to‘g‘ri to‘ldiring" : ""
              }
            >
              {loading ? "Saqlanmoqda..." : "Yaratish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
