import { useState } from "react";
import { createCategory } from "../../api/categories";
import Modal from "../ui/Modal";
import { toast } from "react-toastify";

export default function CategoryCreateModal({ open, onClose, onSaved }) {
  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSave = nameUz.trim() && nameRu.trim() && file;

  function onPick(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      await createCategory({
        name_uz: nameUz.trim(),
        name_ru: nameRu.trim(),
        imageFile: file,
      });
      toast.success("Kategoriya yaratildi");
      onSaved?.();
      onClose?.();
      setNameUz("");
      setNameRu("");
      setFile(null);
    } catch (e) {
      toast.error(
        e?.response?.data?.detail || e.message || "Saqlashda xatolik"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yangi kategoriya"
      size="xl"
      footer={
        <>
          <button className="btn ghost" type="button" onClick={onClose}>
            Bekor
          </button>
          <button
            className="btn primary"
            type="button"
            disabled={!canSave || saving}
            onClick={handleSave}
          >
            Yaratish
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
          `}</style>
        </>
      }
    >
      <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
        <label>
          <span>Nom (UZ) *</span>
          <input
            value={nameUz}
            onChange={(e) => setNameUz(e.target.value)}
            placeholder="masalan: 🥙 Uzbek Doner"
            required
          />
        </label>
        <label>
          <span>Nom (RU) *</span>
          <input
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            placeholder="masalan: 🥙 Узбек Донер"
            required
          />
        </label>
        <label>
          <span>Rasm *</span>
          <input type="file" accept="image/*" onChange={onPick} required />
          {file && (
            <div style={{ fontSize: 12, color: "#334155", marginTop: 6 }}>
              {file.name}
            </div>
          )}
        </label>
      </form>

      <style jsx>{`
        .form-grid {
          display: grid;
          gap: 12px;
        }
        label {
          display: grid;
          gap: 6px;
        }
        label > span {
          font-size: 13px;
          color: #334155;
        }
        input[type="text"],
        input[type="file"] {
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          outline: none;
          background: #fff;
          color: #111827;
        }
        input[type="text"]:focus,
        input[type="file"]:focus {
          border-color: #ff6b00;
          box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.2);
        }
      `}</style>
    </Modal>
  );
}
