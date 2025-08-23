// src/components/products/ProductCreateModal.jsx
import { useMemo, useState } from "react";
import Modal from "../ui/Modal";
import { toast } from "react-toastify";
import { createProduct } from "../../api/products";
import FallbackImage from "../ui/FallbackImage";
import "./product-modals.scss";

export default function ProductCreateModal({
  open,
  categoryId,
  onClose,
  onSaved,
}) {
  const [iikoId, setIikoId] = useState("");
  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [price, setPrice] = useState("");
  const [descUz, setDescUz] = useState("");
  const [descRu, setDescRu] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const canSave = useMemo(() => {
    return (
      (iikoId || "").trim() &&
      (nameUz || "").trim() &&
      (nameRu || "").trim() &&
      String(price).trim() &&
      (descUz || "").trim() &&
      (descRu || "").trim() &&
      !!file &&
      categoryId
    );
  }, [iikoId, nameUz, nameRu, price, descUz, descRu, file, categoryId]);

  const onPick = (e) => setFile(e.target.files?.[0] || null);

  const submit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await createProduct({
        iiko_product_id: iikoId.trim(),
        name_uz: nameUz.trim(),
        name_ru: nameRu.trim(),
        price: Number(price),
        category_id: Number(categoryId),
        description_uz: descUz.trim(),
        description_ru: descRu.trim(),
        imageFile: file,
      });
      toast.success("Mahsulot yaratildi");
      onSaved?.();
      onClose?.();
      setIikoId("");
      setNameUz("");
      setNameRu("");
      setPrice("");
      setDescUz("");
      setDescRu("");
      setFile(null);
    } catch (e) {
      toast.error(
        e?.response?.data?.detail || e.message || "Saqlashda xatolik"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yangi mahsulot"
      size="2xl"
      footer={
        <>
          <button className="pm-btn ghost" type="button" onClick={onClose}>
            Bekor
          </button>
          <button
            className="pm-btn primary"
            type="button"
            disabled={!canSave || saving}
            onClick={submit}
          >
            Yaratish
          </button>
        </>
      }
    >
      <form className="pm-form" onSubmit={(e) => e.preventDefault()}>
        <div className="pm-grid autoFit-280">
          <label>
            <span>IIKO ID *</span>
            <input
              value={iikoId}
              onChange={(e) => setIikoId(e.target.value)}
              placeholder="UUID"
              required
            />
          </label>
          <label>
            <span>Narx (so‘m) *</span>
            <input
              type="number"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="pm-grid autoFit-280">
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

        <div className="pm-grid autoFit-320">
          <label>
            <span>Tavsif (UZ) *</span>
            <textarea
              rows={6}
              value={descUz}
              onChange={(e) => setDescUz(e.target.value)}
              required
            />
          </label>
          <label>
            <span>Tavsif (RU) *</span>
            <textarea
              rows={6}
              value={descRu}
              onChange={(e) => setDescRu(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="pm-grid one">
          <label>
            <span>Rasm *</span>
            <input type="file" accept="image/*" onChange={onPick} required />
            {file && (
              <div className="pm-preview">
                <FallbackImage src={URL.createObjectURL(file)} alt="Preview" />
              </div>
            )}
          </label>
        </div>
      </form>
    </Modal>
  );
}
