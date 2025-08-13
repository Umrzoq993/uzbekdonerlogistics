import { useEffect, useMemo, useState } from "react";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  saveOrderBatch,
} from "../services/categoriesService";
import CategoryFormModal from "../components/CategoryFormModal";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
  Save,
} from "lucide-react";
import "./category-crud.scss";

export default function Categories() {
  // Data
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // UI filters
  const [q, setQ] = useState("");

  // Pagination (client-side, chunki endpoint all qaytaradi)
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1); // 1-index

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null); // row yoki null

  // Local edits for order fields (row_number/queue)
  const [pendingOrderPatch, setPendingOrderPatch] = useState({}); // id -> {row_number, queue}
  const [savingOrder, setSavingOrder] = useState(false);

  // Load
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const list = await fetchCategories();
        setRows(list);
      } catch (e) {
        setErr(
          e.response?.data?.detail ||
            e.message ||
            "Kategoriyalarni yuklab bo‘lmadi"
        );
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derived: filtered + sorted
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = rows;
    if (term) {
      list = rows.filter(
        (r) =>
          r.name_uz.toLowerCase().includes(term) ||
          r.name_ru.toLowerCase().includes(term) ||
          String(r.id).includes(term)
      );
    }
    // Avval row_number, keyin queue, keyin id bo‘yicha
    return [...list].sort((a, b) => {
      if (a.row_number !== b.row_number) return a.row_number - b.row_number;
      if (a.queue !== b.queue) return a.queue - b.queue;
      return a.id - b.id;
    });
  }, [rows, q]);

  // Paging
  const pageCount = Math.max(1, Math.ceil(filtered.length / limit));
  const current = useMemo(() => {
    const start = (page - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, page, limit]);

  const goFirst = () => setPage(1);
  const goLast = () => setPage(pageCount);
  const prev = () => setPage((p) => Math.max(1, p - 1));
  const next = () => setPage((p) => Math.min(pageCount, p + 1));

  // CRUD handlers
  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setEditing(row);
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (vals) => {
    if (editing?.id) {
      const updated = await updateCategory(editing.id, vals);
      setRows((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
    } else {
      const created = await createCategory(vals);
      setRows((prev) => [created, ...prev]);
      setPage(1);
    }
  };

  const handleDelete = async (row) => {
    if (
      !window.confirm(
        `"${row.name_uz}" kategoriyasini o‘chirishni tasdiqlaysizmi?`
      )
    )
      return;
    await deleteCategory(row.id);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  // Inline order edit helpers
  const onChangeOrderField = (id, key, val) => {
    const v = Number(val);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: v } : r)));
    setPendingOrderPatch((m) => ({
      ...m,
      [id]: { ...m[id], [key]: v },
    }));
  };

  const saveOrder = async () => {
    const changed = Object.entries(pendingOrderPatch).map(([id, partial]) => {
      const row = rows.find((r) => String(r.id) === String(id));
      return { id: row.id, row_number: row.row_number, queue: row.queue };
    });
    if (changed.length === 0) return;
    setSavingOrder(true);
    try {
      await saveOrderBatch(changed);
      setPendingOrderPatch({});
    } catch (e) {
      alert(
        e.response?.data?.detail || e.message || "Tartibni saqlab bo‘lmadi"
      );
    } finally {
      setSavingOrder(false);
    }
  };

  return (
    <div className="cat-page">
      <div className="cat-header">
        <h2>Kategoriyalar</h2>
        <div className="tools">
          <div className="search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Qidirish (UZ/RU/ID)..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="perpage">
            <span>Ko‘rsatish:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
            >
              {[5, 10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <button className="btn primary" onClick={openCreate}>
            <Plus size={16} />
            Yangi kategoriya
          </button>
        </div>
      </div>

      <div className="cat-body">
        {loading ? (
          <div className="state">Yuklanmoqda...</div>
        ) : err ? (
          <div className="state error">{String(err)}</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>ID</th>
                  <th>Nomi (UZ)</th>
                  <th>Nomi (RU)</th>
                  <th>Photo</th>
                  <th style={{ width: 120 }}>Row</th>
                  <th style={{ width: 120 }}>Queue</th>
                  <th style={{ width: 140, textAlign: "right" }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {current.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      Hech narsa topilmadi
                    </td>
                  </tr>
                ) : (
                  current.map((r) => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td>{r.name_uz}</td>
                      <td>{r.name_ru}</td>
                      <td className="photo-cell">
                        {r.photo ? (
                          <div className="photo-wrap">
                            <img src={r.photo} alt="thumb" className="thumb" />
                            <div className="photo-tools">
                              <button
                                className="mini-link"
                                onClick={() =>
                                  window.open(
                                    r.photo,
                                    "_blank",
                                    "noopener,noreferrer"
                                  )
                                }
                              >
                                ochish
                              </button>
                              <button
                                className="mini-link"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(
                                      r.photo
                                    );
                                    alert("Photo URL nusxalandi!");
                                  } catch {}
                                }}
                              >
                                nusxala
                              </button>
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <input
                          className="num"
                          type="number"
                          value={r.row_number}
                          onChange={(e) =>
                            onChangeOrderField(
                              r.id,
                              "row_number",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="num"
                          type="number"
                          value={r.queue}
                          onChange={(e) =>
                            onChangeOrderField(r.id, "queue", e.target.value)
                          }
                        />
                      </td>
                      <td className="actions">
                        <button
                          className="icon-btn"
                          title="Tahrirlash"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-btn danger"
                          title="O‘chirish"
                          onClick={() => handleDelete(r)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="cat-footer">
        <div className="left">
          <button
            className="btn"
            disabled={
              savingOrder || Object.keys(pendingOrderPatch).length === 0
            }
            onClick={saveOrder}
            title={
              Object.keys(pendingOrderPatch).length
                ? `${
                    Object.keys(pendingOrderPatch).length
                  } ta o‘zgarish saqlanadi`
                : "O‘zgarish yo‘q"
            }
          >
            <Save size={16} />
            {savingOrder ? "Saqlanmoqda..." : "Tartibni saqlash"}
          </button>
        </div>

        <div className="pager">
          <button
            className="pg-ctrl"
            onClick={goFirst}
            disabled={page <= 1}
            title="Birinchi"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            className="pg-ctrl"
            onClick={prev}
            disabled={page <= 1}
            title="Oldingi"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="pg-text">
            Sahifa <b>{page}</b> / {pageCount}
          </span>

          <button
            className="pg-ctrl"
            onClick={next}
            disabled={page >= pageCount}
            title="Keyingi"
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="pg-ctrl"
            onClick={goLast}
            disabled={page >= pageCount}
            title="Oxirgi"
          >
            <ChevronsRight size={16} />
          </button>

          {/* Jump-to-page */}
          <form
            className="jump-form"
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const inp = form.querySelector("input");
              const n = Math.max(
                1,
                Math.min(pageCount, Number(inp.value) || 1)
              );
              setPage(n);
              inp.value = "";
            }}
          >
            <span>Sakrash:</span>
            <input
              type="number"
              min={1}
              max={pageCount}
              placeholder={`${page}`}
            />
            <button className="btn" type="submit">
              O‘tish
            </button>
          </form>
        </div>
      </div>

      <CategoryFormModal
        open={modalOpen}
        onClose={closeModal}
        initial={editing}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
