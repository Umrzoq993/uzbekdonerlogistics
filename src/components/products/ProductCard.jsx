// src/components/products/ProductCard.jsx
import React from "react";
import FallbackImage from "../ui/FallbackImage";
import { Pencil } from "lucide-react";

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

      <style jsx>{`
        .p-card {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          transition: transform 140ms ease, box-shadow 140ms ease,
            border-color 140ms ease;
          container-type: inline-size;
        }
        .p-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 26px rgba(0, 0, 0, 0.08);
          border-color: #e2e8f0;
        }

        .p-thumb {
          position: relative;
          aspect-ratio: 1 / 1;
          background: #f8fafc;
          overflow: hidden;
        }
        .p-thumb img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }
        .edit-btn {
          position: absolute;
          right: 8px;
          top: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #111827;
          cursor: pointer;
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
        }
        .edit-btn:hover {
          background: #f3f4f6;
        }

        @container (min-width: 300px) {
          .p-thumb {
            aspect-ratio: 4 / 3;
          }
        }
        @container (min-width: 360px) {
          .p-thumb {
            aspect-ratio: 16 / 9;
          }
        }

        .p-info {
          padding: 10px 12px 12px;
          display: grid;
          gap: 6px;
        }
        .p-title {
          margin: 0;
          color: #111827;
          font-weight: 600;
          line-height: 1.35;
          font-size: 15px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .p-price {
          justify-self: start;
          padding: 4px 8px;
          border-radius: 999px;
          background: #fff4ed;
          color: #b45309;
          border: 1px solid #ffd7bf;
          font-weight: 700;
          font-size: 13px;
        }
      `}</style>
    </article>
  );
}
