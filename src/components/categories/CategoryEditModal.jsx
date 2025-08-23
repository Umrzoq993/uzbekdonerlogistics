import { useEffect, useState } from "react";
import { getCategoryById, updateCategory } from "../../api/categories";
import Modal from "../ui/Modal";
import { toast } from "react-toastify";

export default function CategoryEditModal({
  open,
  categoryId,
  onClose,
  onSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [queue, setQueue] = useState("");
  const [rowNumber, setRowNumber] = useState("");

  useEffect(() => {
    let act = true;
    async function load() {
      if (!open || !categoryId) return;
      setLoading(true);
      try {
        const c = await getCategoryById(categoryId);
        if (!act) return;
        setNameUz(c?.name_uz ?? "");
        setNameRu(c?.name_ru ?? "");
        setQueue(c?.queue ?? "");
        setRowNumber(c?.row_number ?? "");
      } catch (e) {
        toast.error(e?.message || "Kategoriya yuklashda xatolik");
      } finally {
        if (act) setLoading(false);
      }
    }
    load();
    return () => {
      act = false;
    };
  }, [open, categoryId]);

  const canSave = (nameUz || "").trim() && (nameRu || "").trim();

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      // numberlarga parse
      const q = queue === "" || queue === null ? undefined : Number(queue);
      const rn =
        rowNumber === "" || rowNumber === null ? undefined : Number(rowNumber);

      await updateCategory({
        category_id: categoryId,
        name_uz: nameUz.trim(),
        name_ru: nameRu.trim(),
        queue: Number.isFinite(q) ? q : undefined,
        row_number: Number.isFinite(rn) ? rn : undefined,
      });

      toast.success("Kategoriya yangilandi");
      onSaved?.();
      onClose?.();
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
      title="Kategoriya tahrirlash"
      size="xl"
      footer={
        <>
          <button className="btn ghost" type="button" onClick={onClose}>
            Bekor
          </button>
          <button
            className="btn primary"
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
          >
            Saqlash
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
      {loading ? (
        <div>Yuklanmoqda...</div>
      ) : (
        <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
          <div className="grid2">
            <label>
              <span>Nom (UZ) *</span>
              <input
                value={nameUz}
                onChange={(e) => setNameUz(e.target.value)}
                required
              />
            </label>
            <label>
              <span>Nom (RU) *</span>
              <input
                value={nameRu}
                onChange={(e) => setNameRu(e.target.value)}
                required
              />
            </label>
          </div>

          <div className="grid2">
            <label>
              <span>Ko‘rsatish tartibi (queue)</span>
              <input
                type="number"
                inputMode="numeric"
                value={queue}
                onChange={(e) => setQueue(e.target.value)}
                placeholder="masalan: 0"
              />
            </label>
            <label>
              <span>Qator (row_number)</span>
              <input
                type="number"
                inputMode="numeric"
                value={rowNumber}
                onChange={(e) => setRowNumber(e.target.value)}
                placeholder="masalan: 1"
              />
            </label>
          </div>

          <p className="hint">
            Rasmni yangilash hozircha API’da yo‘q (faqat nomlar va tartib
            maydonlari).
          </p>
        </form>
      )}

      <style jsx>{`
        .form-grid {
          display: grid;
          gap: 12px;
        }
        .grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 640px) {
          .grid2 {
            grid-template-columns: 1fr;
          }
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
        .hint {
          margin: 4px 0 0;
          font-size: 12px;
          color: #64748b;
        }
      `}</style>
    </Modal>
  );
}
