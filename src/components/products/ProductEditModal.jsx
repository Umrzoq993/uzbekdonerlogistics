// src/components/products/ProductEditModal.jsx
import { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import { toast } from "react-toastify";
import { updateProduct } from "../../api/products";
import FallbackImage from "../ui/FallbackImage";
import "./product-modals.scss";

export default function ProductEditModal({
  open,
  product,
  catOptions = [],
  onClose,
  onSaved,
}) {
  const [iikoId, setIikoId] = useState("");
  const [nameUz, setNameUz] = useState("");
  const [nameRu, setNameRu] = useState("");
  const [price, setPrice] = useState("");
  const [descUz, setDescUz] = useState("");
  const [descRu, setDescRu] = useState("");
  const [active, setActive] = useState(true);
  const [orderBy, setOrderBy] = useState("");
  const [categoryId, setCategoryId] = useState(null);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !product) return;
    setIikoId(product?.iiko_product_id || "");
    setNameUz(product?.name_uz || "");
    setNameRu(product?.name_ru || "");
    setPrice(product?.price ?? "");
    setDescUz(product?.description_uz || "");
    setDescRu(product?.description_ru || "");
    setActive(Boolean(product?.active ?? true));
    setOrderBy(product?.order ?? product?.order_by ?? "");
    setCategoryId(
      product?.category?.category_id ?? product?.category_id ?? null
    );
    setFile(null);
  }, [open, product]);

  const canSave = useMemo(() => {
    return (
      !!product?.product_id &&
      (nameUz || "").trim() &&
      (nameRu || "").trim() &&
      String(price).trim()
    );
  }, [product?.product_id, nameUz, nameRu, price]);

  const onPick = (e) => setFile(e.target.files?.[0] || null);

  const submit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await updateProduct({
        product_id: product?.product_id,
        iiko_product_id: iikoId || undefined,
        name_uz: nameUz.trim(),
        name_ru: nameRu.trim(),
        price: Number(price),
        category_id: categoryId ? Number(categoryId) : undefined,
        description_uz: (descUz || "").trim(),
        description_ru: (descRu || "").trim(),
        active,
        order_by:
          orderBy !== "" && orderBy !== null ? Number(orderBy) : undefined,
        imageFile: file || undefined,
      });
      toast.success("Mahsulot yangilandi");
      onSaved?.();
      onClose?.();
    } catch (e) {
      toast.error(
        e?.response?.data?.detail || e.message || "Saqlashda xatolik"
      );
    } finally {
      setSaving(false);
    }
  };

  const currentImg =
    product?.photo?._url || product?.image_url || product?.image || null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      title={`Mahsulotni tahrirlash #${product?.product_id ?? "—"}`}
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
            Saqlash
          </button>
        </>
      }
    >
      {!product ? (
        <div>Yuklanmoqda…</div>
      ) : (
        <form className="pm-form" onSubmit={(e) => e.preventDefault()}>
          <div className="pm-grid autoFit-220">
            <label>
              <span>IIKO ID</span>
              <input
                value={iikoId}
                onChange={(e) => setIikoId(e.target.value)}
                placeholder="UUID"
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
            <label>
              <span>Tartib (order_by)</span>
              <input
                type="number"
                inputMode="numeric"
                value={orderBy}
                onChange={(e) => setOrderBy(e.target.value)}
                placeholder="masalan: 1"
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
              <span>Tavsif (UZ)</span>
              <textarea
                rows={6}
                value={descUz}
                onChange={(e) => setDescUz(e.target.value)}
              />
            </label>
            <label>
              <span>Tavsif (RU)</span>
              <textarea
                rows={6}
                value={descRu}
                onChange={(e) => setDescRu(e.target.value)}
              />
            </label>
          </div>

          <div className="pm-grid autoFit-280">
            <label>
              <span>Kategoriya</span>
              <select
                value={categoryId ?? ""}
                onChange={(e) => setCategoryId(e.target.value || null)}
              >
                <option value="">O‘zgartirmaslik</option>
                {catOptions.map((c) => (
                  <option key={c.category_id} value={c.category_id}>
                    {c.name_uz || c.name_ru}
                  </option>
                ))}
              </select>
            </label>
            <label className="pm-row">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <span>Faol (active)</span>
            </label>
          </div>

          <div className="pm-grid one">
            <label>
              <span>Rasm (ixtiyoriy yangilash)</span>
              <input type="file" accept="image/*" onChange={onPick} />
              <div className="pm-previewRow">
                <div className="pm-preview">
                  <FallbackImage
                    src={file ? URL.createObjectURL(file) : currentImg}
                    alt="Mahsulot rasmi"
                  />
                </div>
                <div className="pm-hint">
                  Agar rasm tanlanmasa, eski rasm saqlanib qoladi.
                </div>
              </div>
            </label>
          </div>
        </form>
      )}
    </Modal>
  );
}
