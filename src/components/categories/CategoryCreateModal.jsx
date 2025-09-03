import { useState } from "react";
import { createCategory } from "../../api/categories";
import Modal from "../ui/Modal";
import "../../styles/_buttons.scss";
import "./category-create-modal.scss";
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

      {/* styles moved to category-create-modal.scss */}
    </Modal>
  );
}
