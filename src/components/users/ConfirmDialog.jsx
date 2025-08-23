// src/components/users/ConfirmDialog.jsx
import Modal from "../ui/Modal";
import { deleteUser } from "../../api/users";
import { useState } from "react";

export default function ConfirmDialog({ open, user, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      await deleteUser(user?.user_id);
      onDeleted?.();
      onClose?.();
    } catch (e) {
      alert(e.message || "O‘chirishda xatolik.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tasdiqlash"
      footer={
        <>
          <button className="btn ghost" type="button" onClick={onClose}>
            Bekor
          </button>
          <button
            className="btn danger"
            type="button"
            onClick={handleDelete}
            disabled={loading}
          >
            Ha, o‘chir
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
            .btn.ghost {
              background: #fff;
            }
            .btn.danger {
              background: #ef4444;
              border-color: #ef4444;
              color: #fff;
            }
            .btn.danger:hover {
              filter: brightness(0.96);
            }
          `}</style>
        </>
      }
    >
      <p style={{ margin: 0, color: "#111827" }}>
        <strong>{user?.full_name}</strong> foydalanuvchisini o‘chirmoqchimisiz?
      </p>
    </Modal>
  );
}
