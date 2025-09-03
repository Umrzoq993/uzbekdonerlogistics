// src/pages/Categories.jsx
import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { getCategories, getProductsByCategory } from "../api/categories";
import ProductCard from "../components/products/ProductCard";
import { Loader2, Search, Plus, Pencil, RefreshCw, X } from "lucide-react";
import CategoryCreateModal from "../components/categories/CategoryCreateModal";
import CategoryEditModal from "../components/categories/CategoryEditModal";
import ProductCreateModal from "../components/products/ProductCreateModal";
import ProductEditModal from "../components/products/ProductEditModal";
import { toast } from "react-toastify";
import "./category-browse.scss";
import FallbackImage from "../components/ui/FallbackImage";

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [catQ, setCatQ] = useState("");
  const deferredQ = useDeferredValue(catQ);

  const [selectedId, setSelectedId] = useState(null);

  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [prodErr, setProdErr] = useState("");
  const abortRef = useRef(null);

  // Kategoriya CRUD modallari
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Mahsulot CRUD modallari
  const [prodCreateOpen, setProdCreateOpen] = useState(false);
  const [prodEdit, setProdEdit] = useState(null);

  const [, /* isPending */ startTransition] = useTransition();

  const selectedCat = useMemo(
    () => cats.find((c) => c.category_id === selectedId) || null,
    [cats, selectedId]
  );

  const sortCats = (arr) =>
    arr.sort(
      (a, b) =>
        (a.row_number || 0) - (b.row_number || 0) ||
        (a.queue || 0) - (b.queue || 0) ||
        String(a.name_uz || a.name_ru || "").localeCompare(
          String(b.name_uz || b.name_ru || "")
        )
    );

  // Kategoriyalarni yuklash
  const loadCats = useCallback(
    async (preserveId) => {
      try {
        const data = await getCategories();
        sortCats(data);
        setCats(data);
        if (preserveId) {
          const found = data.find((c) => c.category_id === preserveId);
          setSelectedId(
            found ? found.category_id : data[0]?.category_id ?? null
          );
        } else {
          setSelectedId((prev) =>
            prev && data.some((d) => d.category_id === prev)
              ? prev
              : data[0]?.category_id ?? null
          );
        }
      } catch (e) {
        console.error(e);
        toast.error("Kategoriyalarni yuklashda xatolik.");
      }
    },
    [setCats]
  );

  useEffect(() => {
    loadCats();
  }, [loadCats]);

  // Mahsulotlar
  const fetchProducts = useCallback(async (catId, signal) => {
    setProdErr("");
    const list = await getProductsByCategory(catId, signal);
    return Array.isArray(list) ? list : [];
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setItems([]);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setBusy(true);
    (async () => {
      try {
        const list = await fetchProducts(selectedId, ctrl.signal);
        setItems(list);
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          console.error(e);
          setItems([]);
          setProdErr("Mahsulotlarni yuklashda xatolik.");
        }
      } finally {
        setBusy(false);
      }
    })();

    return () => ctrl.abort();
  }, [selectedId, fetchProducts]);

  // Qidiruv (chiplar)
  const filteredCats = useMemo(() => {
    const s = deferredQ.trim().toLowerCase();
    if (!s) return cats;
    return cats.filter(
      (c) =>
        String(c.name_uz || "")
          .toLowerCase()
          .includes(s) ||
        String(c.name_ru || "")
          .toLowerCase()
          .includes(s)
    );
  }, [cats, deferredQ]);

  // Klaviatura navigatsiyasi (chiplar)
  const chipsWrapRef = useRef(null);
  const onChipsKeyDown = (e) => {
    const keys = [
      "ArrowDown",
      "ArrowUp",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
    ];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const buttons = chipsWrapRef.current?.querySelectorAll("button.chip");
    if (!buttons || !buttons.length) return;

    const idx = Array.from(buttons).findIndex(
      (b) => Number(b.dataset.id) === Number(selectedId)
    );
    const move = (newIdx) => {
      const btn = buttons[newIdx];
      if (btn) {
        const id = Number(btn.dataset.id);
        startTransition(() => setSelectedId(id));
        btn.focus();
      }
    };

    if (e.key === "Home") move(0);
    else if (e.key === "End") move(buttons.length - 1);
    else if (e.key === "ArrowDown" || e.key === "ArrowRight")
      move(Math.min(idx + 1, buttons.length - 1));
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
      move(Math.max(idx - 1, 0));
  };

  // Mahsulotlarni qayta yuklash
  const refetchProducts = () => {
    if (!selectedId || busy) return;
    setBusy(true);
    setProdErr("");
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    (async () => {
      try {
        const list = await fetchProducts(selectedId, ctrl.signal);
        setItems(list);
      } catch (e) {
        if (e.name !== "CanceledError" && e.name !== "AbortError") {
          console.error(e);
          setItems([]);
          setProdErr("Mahsulotlarni yuklashda xatolik.");
        }
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <div className="cb-page">
      {/* header */}
      <div className="cb-header">
        <h2>Kategoriyalar</h2>
        <div className="tools">
          <div className="search">
            <Search size={16} />
            <input
              placeholder="Kategoriya qidirish..."
              value={catQ}
              onChange={(e) => setCatQ(e.target.value)}
              aria-label="Kategoriya qidirish"
            />
            {catQ && (
              <button
                type="button"
                aria-label="Tozalash"
                className="clear"
                onClick={() => setCatQ("")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Kategoriya yaratish / tahrirlash */}
          <button
            className="btn primary"
            type="button"
            onClick={() => setCreateOpen(true)}
            title="Yangi kategoriya"
          >
            <Plus size={16} /> Yangi
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => setEditOpen(true)}
            disabled={!selectedId}
            title="Tanlangan kategoriyani tahrirlash"
          >
            <Pencil size={16} /> Tahrirlash
          </button>
        </div>
      </div>

      {/* body */}
      <div className="cb-body">
        <div
          className="cat-chips"
          role="tablist"
          aria-label="Kategoriyalar"
          ref={chipsWrapRef}
          onKeyDown={onChipsKeyDown}
        >
          {filteredCats.map((c) => {
            const active = c.category_id === selectedId;
            return (
              <button
                key={c.category_id}
                data-id={c.category_id}
                role="tab"
                aria-selected={active}
                className={`chip ${active ? "active" : ""}`}
                onClick={() =>
                  startTransition(() => setSelectedId(c.category_id))
                }
                title={c.name_uz || c.name_ru}
              >
                <span className="thumb">
                  <FallbackImage
                    src={c.photo?._url}
                    alt={c.name_uz || c.name_ru || "Kategoriya"}
                    loading="lazy"
                  />
                </span>
                <span className="label">{c.name_uz || c.name_ru}</span>
              </button>
            );
          })}
          {!filteredCats.length && (
            <div className="muted">Kategoriya topilmadi.</div>
          )}
        </div>

        <div className="prod-pane">
          <div className="pane-head" aria-live="polite">
            <div className="title">
              {selectedCat?.name_uz || selectedCat?.name_ru || "—"}
              <span className="count-badge">{items.length}</span>
            </div>

            <div className="head-tools">
              <button
                type="button"
                className="btn primary"
                onClick={() => setProdCreateOpen(true)}
                disabled={!selectedId}
                title="Yangi mahsulot qo‘shish"
              >
                <Plus size={16} />
                Yangi mahsulot
              </button>

              <button
                type="button"
                className="btn ghost"
                onClick={refetchProducts}
                disabled={!selectedId || busy}
                title="Mahsulotlarni yangilash"
              >
                <RefreshCw size={16} />
                Yangilash
              </button>

              {busy && (
                <div className="loading">
                  <Loader2 className="spin" size={16} /> Yuklanmoqda…
                </div>
              )}
            </div>
          </div>

          {/* Scroll konteyner */}
          <div className="pane-scroll">
            <div className="grid">
              {busy ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={`skel-${i}`} className="p-skeleton">
                    <div className="skel-img" />
                    <div className="skel-line w-80" />
                    <div className="skel-line w-60" />
                  </div>
                ))
              ) : items.length ? (
                items.map((p, i) => (
                  <ProductCard
                    key={p.product_id || p.id || i}
                    item={p}
                    onEdit={() => setProdEdit(p)}
                  />
                ))
              ) : (
                <div className="muted">Mahsulot topilmadi.</div>
              )}
              {prodErr && !busy && <div className="state error">{prodErr}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Kategoriya CREATE */}
      <CategoryCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaved={() => loadCats(selectedId)}
      />

      {/* Kategoriya EDIT */}
      <CategoryEditModal
        open={editOpen}
        categoryId={selectedId}
        onClose={() => setEditOpen(false)}
        onSaved={() => loadCats(selectedId)}
      />

      {/* Mahsulot CREATE */}
      <ProductCreateModal
        open={prodCreateOpen}
        categoryId={selectedId}
        onClose={() => setProdCreateOpen(false)}
        onSaved={refetchProducts}
      />

      {/* Mahsulot EDIT */}
      <ProductEditModal
        open={!!prodEdit}
        product={prodEdit}
        catOptions={cats}
        onClose={() => setProdEdit(null)}
        onSaved={refetchProducts}
      />
    </div>
  );
}
