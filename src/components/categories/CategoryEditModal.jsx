// src/components/categories/CategoryEditModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { getCategoryById, updateCategory } from "../../api/categories";
import Modal from "../ui/Modal";
import "../../styles/_buttons.scss";
import "./category-edit-modal.scss";
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
      {/* styles moved to category-edit-modal.scss */}
    </Modal>
  );
}
