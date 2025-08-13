import { useEffect, useMemo, useState } from "react";
import "./category-form-modal.scss";

export default function CategoryFormModal({
  open,
  onClose,
  initial, // {id?, name_uz, name_ru, photo(url), queue, row_number}
  onSubmit, // (valuesWithFile) => Promise<void>
}) {
  const isEdit = !!initial?.id;

  const [values, setValues] = useState({
    name_uz: "",
    name_ru: "",
    photo: "", // URL (faqat ko‘rsatish uchun)
    queue: 0,
    row_number: 0,
  });
  const [photoFile, setPhotoFile] = useState(null); // Yangi yuklanadigan fayl
  const [preview, setPreview] = useState(""); // Ko‘rsatish uchun src
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // initial’ni yuklash
  useEffect(() => {
    if (!open) return;
    setErr("");
    setSaving(false);
    setPhotoFile(null);
    setValues({
      name_uz: initial?.name_uz ?? "",
      name_ru: initial?.name_ru ?? "",
      photo: initial?.photo ?? "", // URL
      queue: Number(initial?.queue ?? 0),
      row_number: Number(initial?.row_number ?? 0),
    });
  }, [open, initial]);

  // preview: photoFile > URL’dan preview; aks holda initial.photo ko‘rsatiladi
  useEffect(() => {
    if (photoFile instanceof File) {
      const url = URL.createObjectURL(photoFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(values.photo || "");
  }, [photoFile, values.photo]);

  const valid = useMemo(() => {
    return values.name_uz.trim() && values.name_ru.trim();
  }, [values]);

  const onChange = (k) => (e) => {
    const v =
      e.target.type === "number" ? Number(e.target.value) : e.target.value;
    setValues((s) => ({ ...s, [k]: v }));
  };

  const onPickFile = (e) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
  };

  const clearFile = () => setPhotoFile(null);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!valid || saving) return;
    setSaving(true);
    setErr("");
    try {
      await onSubmit({ ...values, photoFile });
      onClose?.();
    } catch (e2) {
      setErr(
        e2?.response?.data?.detail ||
          e2?.message ||
          "Saqlashda xatolik yuz berdi"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="cat-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="cat-modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="cat-head">
          <h3>{isEdit ? "Kategoriyani tahrirlash" : "Yangi kategoriya"}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish">
            ✕
          </button>
        </div>

        <form className="cat-form" onSubmit={handleSubmit}>
          {err ? <div className="state error">{err}</div> : null}

          <div className="form-row">
            <label>
              <span>Nomi (UZ)</span>
              <input
                type="text"
                value={values.name_uz}
                onChange={onChange("name_uz")}
                placeholder="Masalan: 🥙 Uzbek Doner"
                required
              />
            </label>
            <label>
              <span>Nomi (RU)</span>
              <input
                type="text"
                value={values.name_ru}
                onChange={onChange("name_ru")}
                placeholder="Например: 🥙 Узбек Донер"
                required
              />
            </label>
          </div>

          {/* PHOTO: URL preview + file upload */}
          <div className="form-row w-2">
            <label className="photo-field">
              <span>Rasm (file yuboriladi)</span>

              <div className="photo-inputs">
                <div className="file">
                  <input type="file" accept="image/*" onChange={onPickFile} />
                  {photoFile ? (
                    <button
                      type="button"
                      className="btn light"
                      onClick={clearFile}
                    >
                      Tozalash
                    </button>
                  ) : null}
                </div>

                <div className="preview">
                  {preview ? (
                    <img src={preview} alt="preview" />
                  ) : (
                    <div className="no-preview">Rasm tanlanmagan</div>
                  )}
                </div>

                {/* Faqat ko‘rsatish: mavjud URL (edit holatida) */}
                {values.photo && !photoFile ? (
                  <div className="url-line" title={values.photo}>
                    <span className="mono">{values.photo}</span>
                    <button
                      type="button"
                      className="mini-link"
                      onClick={() =>
                        window.open(
                          values.photo,
                          "_blank",
                          "noopener,noreferrer"
                        )
                      }
                    >
                      ochish
                    </button>
                  </div>
                ) : null}
              </div>
              <small className="hint">
                Yangi rasm tanlasangiz, u yuboriladi. Tanlamasangiz — eski URL
                o‘zgarishsiz qoladi.
              </small>
            </label>
          </div>

          <div className="form-row">
            <label>
              <span>Row (row_number)</span>
              <input
                type="number"
                value={values.row_number}
                onChange={onChange("row_number")}
                min={0}
              />
            </label>
            <label>
              <span>Queue</span>
              <input
                type="number"
                value={values.queue}
                onChange={onChange("queue")}
                min={0}
              />
            </label>
          </div>

          <div className="form-actions">
            <button className="btn" type="button" onClick={onClose}>
              Bekor qilish
            </button>
            <button
              className="btn primary"
              type="submit"
              disabled={!valid || saving}
            >
              {saving ? "Saqlanmoqda..." : isEdit ? "Saqlash" : "Qo‘shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
