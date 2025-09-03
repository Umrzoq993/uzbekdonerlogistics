// src/components/users/ConfirmDialog.jsx
import Modal from "../ui/Modal";
import "../../styles/_buttons.scss";
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
        </>
      }
    >
      <p style={{ margin: 0, color: "#111827" }}>
        <strong>{user?.full_name}</strong> foydalanuvchisini o‘chirmoqchimisiz?
      </p>
    </Modal>
  );
}
