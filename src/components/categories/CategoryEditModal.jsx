// src/components/categories/CategoryEditModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { getCategoryById, updateCategory } from "../../api/categories";
import Modal from "../ui/Modal";
import { toast } from "react-toastify";
import { Image as ImageIcon, Loader2, Trash2, Upload } from "lucide-react";

/**
 * Rasm talablari:
 *  - format: jpg | png | webp
 *  - max: 3 MB
 *  - tavsiya: kvadrat (1:1), ≥ 400x400
 */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 3 * 1024 * 1024;

export default function CategoryEditModal({
  open,
  categoryId,
  onClose,
  onSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // text fields
  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [queue, setQueue] = useState("");
  const [rowNumber, setRowNumber] = useState("");

  // image states
  const [currentUrl, setCurrentUrl] = useState(""); // serverdan kelgan mavjud rasm
  const [file, setFile] = useState(null); // yangi tanlangan fayl
  const [preview, setPreview] = useState(""); // local preview

  const fileInputRef = useRef(null);

  // serverdan ma'lumotlarni yuklash
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
        setCurrentUrl(c?.photo?._url || "");
        setFile(null);
        setPreview("");
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

  // fayl validatsiyasi
  function validateFile(f) {
    if (!ACCEPTED_TYPES.includes(f.type)) {
      toast.error("Faqat JPG/PNG/WebP rasm yuklang.");
      return false;
    }
    if (f.size > MAX_SIZE) {
      toast.error("Rasm hajmi 3 MB dan oshmasin.");
      return false;
    }
    return true;
  }

  // fayl tanlash
  function onPickFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!validateFile(f)) {
      e.target.value = "";
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  // drag&drop
  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (!validateFile(f)) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }
  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

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
        name_uz: String(nameUz || "").trim(),
        name_ru: String(nameRu || "").trim(),
        queue: Number.isFinite(q) ? q : undefined,
        row_number: Number.isFinite(rn) ? rn : undefined,
        imageFile: file || undefined, // 🔑 rasm bo‘lsa yuboramiz
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

  // UI: ko‘rinadigan rasm manbai
  const shownImage = useMemo(
    () => preview || currentUrl || "",
    [preview, currentUrl]
  );

  // tanlovni bekor qilish
  function resetImageSelection() {
    setFile(null);
    setPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
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
            {saving ? <Loader2 className="spin" size={16} /> : null}
            Saqlash
          </button>
          <style jsx>{`
            .btn {
              padding: 10px 14px;
              border-radius: 12px;
              font-weight: 700;
              border: 1px solid #e5e7eb;
              background: #fff;
              color: #111827;
              cursor: pointer;
              display: inline-flex;
              align-items: center;
              gap: 8px;
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
              box-shadow: 0 6px 16px rgba(255, 107, 0, 0.25);
            }
            .btn.primary:hover {
              filter: brightness(0.95);
            }
            .spin {
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              from {
                transform: rotate(0);
              }
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </>
      }
    >
      {loading ? (
        <div className="loading">Yuklanmoqda…</div>
      ) : (
        <form className="form-grid" onSubmit={(e) => e.preventDefault()}>
          <div className="grid2">
            {/* Chap: rasm uploader */}
            <div>
              <label className="field-label">Kategoriya rasmi</label>

              {/* Agar rasm bor bo‘lsa — preview kartochka */}
              {shownImage ? (
                <div className="image-card">
                  <img src={shownImage} alt="Kategoriya" />
                  <div className="overlay">
                    <button
                      className="i-btn"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Rasmni almashtirish"
                    >
                      <Upload size={16} />
                      Almashtirish
                    </button>
                    {preview && (
                      <button
                        className="i-btn danger"
                        type="button"
                        onClick={resetImageSelection}
                        title="Yangi tanlovni bekor qilish"
                      >
                        <Trash2 size={16} />
                        Bekor qilish
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // Rasm yo‘q — drag&drop zonasi
                <div
                  className="dropzone"
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <div className="dz-inner">
                    <div className="icon">
                      <ImageIcon size={28} />
                    </div>
                    <div className="dz-text">
                      <strong>Rasm yuklash</strong> (JPG/PNG/WebP, &le; 3MB)
                    </div>
                    <div className="dz-hint">Drag&drop yoki bosing</div>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={onPickFile}
              />

              <p className="hint">
                Tavsiya: kvadrat 1:1 (masalan 600×600). Kichik o‘lchamlar piksel
                bo‘lib ko‘rinishi mumkin.
              </p>
            </div>

            {/* O'ng: matn va tartib maydonlari */}
            <div className="fields">
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

              <div className="grid2-sm">
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
            </div>
          </div>
        </form>
      )}

      <style jsx>{`
        .loading {
          padding: 24px;
        }
        .form-grid {
          display: grid;
          gap: 16px;
        }
        .grid2 {
          display: grid;
          grid-template-columns: 360px 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) {
          .grid2 {
            grid-template-columns: 1fr;
          }
        }
        .field-label {
          display: block;
          font-size: 13px;
          color: #334155;
          margin-bottom: 8px;
          font-weight: 600;
        }

        /* Dropzone */
        .dropzone {
          border: 1px dashed #cbd5e1;
          border-radius: 14px;
          background: #f8fafc;
          min-height: 180px;
          display: grid;
          place-items: center;
          cursor: pointer;
          transition: 0.15s ease border-color, 0.15s ease box-shadow;
        }
        .dropzone:hover {
          border-color: #94a3b8;
          box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.2);
        }
        .dz-inner {
          text-align: center;
          color: #475569;
          display: grid;
          gap: 6px;
          padding: 18px;
        }
        .dz-inner .icon {
          display: grid;
          place-items: center;
        }
        .dz-text strong {
          color: #0f172a;
        }
        .dz-hint {
          font-size: 12px;
          color: #64748b;
        }

        /* Image preview card */
        .image-card {
          position: relative;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 8px 24px rgba(2, 6, 23, 0.06);
        }
        .image-card img {
          display: block;
          width: 100%;
          height: auto;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          background: #f1f5f9;
        }
        .image-card .overlay {
          position: absolute;
          inset: auto 0 0 0;
          background: linear-gradient(180deg, transparent, rgba(2, 6, 23, 0.6));
          padding: 10px;
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .i-btn {
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #0f172a;
          padding: 8px 10px;
          border-radius: 10px;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .i-btn:hover {
          background: #f3f4f6;
        }
        .i-btn.danger {
          border-color: #fecaca;
          background: #fee2e2;
          color: #991b1b;
        }

        /* Fields */
        .fields {
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
          font-weight: 600;
        }
        input {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 12px;
          outline: none;
          background: #fff;
          color: #0f172a;
          transition: 0.15s ease border-color, 0.15s ease box-shadow;
        }
        input:focus {
          border-color: #ff6b00;
          box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.2);
        }
        .grid2-sm {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 640px) {
          .grid2-sm {
            grid-template-columns: 1fr;
          }
        }
        .hint {
          margin: 8px 2px 0;
          font-size: 12px;
          color: #64748b;
        }
      `}</style>
    </Modal>
  );
}
