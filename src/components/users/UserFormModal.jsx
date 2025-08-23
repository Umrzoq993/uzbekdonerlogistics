// src/components/users/UserFormModal.jsx
import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { createUser, getUserById, updateUser } from "../../api/users";

/**
 * Props:
 * - open: bool
 * - mode: 'create' | 'edit'
 * - userId: edit mode uchun kerak
 * - onClose: fn
 * - onSaved: fn (refresh uchun)
 */
export default function UserFormModal({
  open,
  mode = "edit",
  userId,
  onClose,
  onSaved,
}) {
  const isCreate = mode === "create";

  const [form, setForm] = useState({
    user_id: "",
    full_name: "",
    username: "",
    password: "",
    date_created: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create: full_name, username, password majburiy
  // Edit: full_name, username majburiy; password ixtiyoriy
  const canSave =
    (form.full_name || "").trim() &&
    (form.username || "").trim() &&
    (isCreate ? (form.password || "").trim() : true);

  // Modal ochilganda: create -> form reset; edit -> get by id
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      if (!open) return;

      if (isCreate) {
        setForm({
          user_id: "",
          full_name: "",
          username: "",
          password: "",
          date_created: "",
        });
        return;
      }

      if (!userId) return;
      setLoading(true);
      try {
        const u = await getUserById(userId);
        if (!active) return;
        setForm({
          user_id: u?.user_id ?? userId,
          full_name: u?.full_name ?? "",
          username: u?.username ?? "",
          password: "",
          date_created: u?.date_created ?? "",
        });
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      active = false;
    };
  }, [open, isCreate, userId]);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      if (isCreate) {
        await createUser({
          full_name: form.full_name,
          username: form.username,
          password: form.password,
        });
      } else {
        await updateUser({
          user_id: form.user_id,
          full_name: form.full_name,
          username: form.username,
          // parol kiritilsa yuboramiz, bo‘lmasa yubormaymiz
          password: form.password?.trim() ? form.password : undefined,
        });
      }
      onSaved?.();
      onClose?.();
    } catch (e) {
      alert(e?.response?.data?.detail || e.message || "Saqlashda xatolik.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isCreate ? "Yangi foydalanuvchi" : "Foydalanuvchini tahrirlash"}
      footer={
        <>
          <button className="btn ghost" type="button" onClick={onClose}>
            Bekor qilish
          </button>
          <button
            className="btn primary"
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            {isCreate ? "Yaratish" : "Saqlash"}
          </button>
          <style jsx>{`
            .btn {
              padding: 8px 12px;
              border-radius: 10px;
              font-weight: 600;
              border: 1px solid #e5e7eb;
              background: #fff;
              color: #111827;
              cursor: pointer;
            }
            .btn:hover {
              background: #f3f4f6;
            }
            .btn:disabled {
              opacity: 0.6;
              cursor: not-allowed;
            }
            .btn.primary {
              background: #ff6b00;
              border-color: #ff6b00;
              color: #fff;
            }
            .btn.primary:hover {
              filter: brightness(0.95);
            }
            .btn.ghost {
              background: #fff;
            }
          `}</style>
        </>
      }
    >
      {loading ? (
        <div>Yuklanmoqda...</div>
      ) : (
        <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
          {!isCreate && (
            <label>
              <span>ID</span>
              <input value={form.user_id || ""} disabled />
            </label>
          )}

          <label>
            <span>To‘liq ism</span>
            <input
              value={form.full_name}
              onChange={(e) =>
                setForm((s) => ({ ...s, full_name: e.target.value }))
              }
              placeholder="Masalan, Sobir Tursunaliev"
              required
            />
          </label>

          <label>
            <span>Login (username)</span>
            <input
              value={form.username}
              onChange={(e) =>
                setForm((s) => ({ ...s, username: e.target.value }))
              }
              placeholder="masalan, sobirtb"
              required
            />
          </label>

          <label>
            <span>Parol {isCreate ? "(majburiy)" : "(ixtiyoriy)"}</span>
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((s) => ({ ...s, password: e.target.value }))
              }
              placeholder={
                isCreate
                  ? "Yangi parol"
                  : "Yangi parol (agar o‘zgartirmoqchi bo‘lsangiz)"
              }
              required={isCreate}
            />
          </label>

          {!isCreate && (
            <label>
              <span>Yaratilgan sana</span>
              <input value={form.date_created || ""} disabled />
            </label>
          )}
        </form>
      )}

      <style jsx>{`
        .form-grid {
          display: grid;
          gap: 12px;
          margin-bottom: 8px;
        }
        label {
          display: grid;
          gap: 6px;
        }
        label > span {
          font-size: 13px;
          color: #334155;
        }
        input {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          outline: none;
          background: #fff;
          color: #111827;
        }
        input:focus {
          border-color: #ff6b00;
          box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.2);
        }
        input[disabled] {
          background: #f8fafc;
          color: #6b7280;
        }
      `}</style>
    </Modal>
  );
}
