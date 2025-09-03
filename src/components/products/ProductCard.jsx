// src/components/products/ProductCard.jsx
import React from "react";
import FallbackImage from "../ui/FallbackImage";
import { Pencil } from "lucide-react";
import "../../styles/_buttons.scss"; // shared button styles
import "./product-card.scss"; // card styles

export default function ProductCard({ item, onEdit }) {
  const title =
    item?.name_uz ??
    item?.name_ru ??
    item?.name ??
    item?.title ??
    "Nomsiz mahsulot";
  const price = item?.price ?? item?.cost ?? item?.amount ?? null;

  const img =
    item?.photo?._url || item?.image_url || item?.image || item?.img || null;

  return (
    <article className="p-card" title={title}>
      <div className="p-thumb">
        <FallbackImage src={img} alt={title} loading="lazy" decoding="async" />
        {typeof onEdit === "function" && (
          <button
            className="edit-btn"
            type="button"
            title="Tahrirlash"
            onClick={() => onEdit(item)}
          >
            <Pencil size={16} />
          </button>
        )}
      </div>

      <div className="p-info">
        <h4 className="p-title">{title}</h4>
        {price != null && (
          <div className="p-price">{Number(price).toLocaleString()} so‘m</div>
        )}
      </div>

      {/* styles moved to product-card.scss */}
    </article>
  );
}
