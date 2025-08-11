import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ReactPaginate from "react-paginate";
import {
  fetchOrders,
  patchOrderFlial,
  patchOrderCourier,
} from "../services/ordersService";
import { fetchFlials } from "../services/flialsService";
import {
  fetchCouriersByFlial,
  fetchCourierById,
} from "../services/couriersService";
import MapModal from "../components/MapModal";
import {
  MapPin,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from "lucide-react";
import "./orders.scss";

const STATUS_OPTIONS = [
  "",
  "waiting",
  "confirmed",
  "rejected",
  "onway",
  "received",
];

// Kuryer nomini silliqlash + fallback
const formatCourierName = (c) => {
  const raw = (c?.name ?? "").trim();
  const cleaned = raw.replace(/[\n\r]+/g, " · ").replace(/\s{2,}/g, " ");
  return cleaned || `#${c?.id ?? ""}`;
};

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();

  const qp = useMemo(() => {
    const status = searchParams.get("status") || "";
    const flial_id = searchParams.get("flial_id") || "";
    const limit = Number(searchParams.get("limit") || 10);
    const offset = Number(searchParams.get("offset") || 0);
    return { status, flial_id, limit, offset };
  }, [searchParams]);

  // Data
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Flials
  const [flials, setFlials] = useState([]);
  const [flialsLoading, setFlialsLoading] = useState(false);
  const [flialsErr, setFlialsErr] = useState("");

  // Couriers cache: { [flialId]: Array<{id,name,flial_id,is_active}> }
  const [couriersByFlial, setCouriersByFlial] = useState({});
  const [couriersLoading, setCouriersLoading] = useState({});
  const [couriersErr, setCouriersErr] = useState({});

  // Map & saving
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(() => new Set());

  // Jump-to-page local state
  const [jumpInput, setJumpInput] = useState("");

  // URL helpers
  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val === "" || val == null) next.delete(key);
    else next.set(key, String(val));
    setSearchParams(next, { replace: true });
  };
  const setMultipleParams = (obj) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(obj).forEach(([k, v]) => {
      if (v === "" || v == null) next.delete(k);
      else next.set(k, String(v));
    });
    setSearchParams(next, { replace: true });
  };

  // Flials once
  useEffect(() => {
    (async () => {
      setFlialsLoading(true);
      setFlialsErr("");
      try {
        const list = await fetchFlials();
        setFlials(list);
      } catch (e) {
        setFlialsErr(
          e.response?.data?.detail || e.message || "Fliallarni yuklab bo‘lmadi"
        );
        setFlials([]);
      } finally {
        setFlialsLoading(false);
      }
    })();
  }, []);

  // Orders on filter/page change
  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const { items, total } = await fetchOrders(qp);
        setRows(Array.isArray(items) ? items : []);
        const t = Number(total);
        setTotal(Number.isFinite(t) ? t : null);
      } catch (e) {
        setErr(
          e.response?.data?.detail || e.message || "Ma'lumotni olib bo‘lmadi"
        );
        setRows([]);
        setTotal(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [qp.status, qp.flial_id, qp.limit, qp.offset]);

  // Couriers by flial (cache)
  const ensureCouriers = useCallback(
    async (flialId) => {
      if (!flialId) return;
      if (couriersByFlial[flialId]) return; // cached
      setCouriersLoading((m) => ({ ...m, [flialId]: true }));
      setCouriersErr((m) => ({ ...m, [flialId]: "" }));
      try {
        let list = await fetchCouriersByFlial(flialId);
        list = list.sort((a, b) => Number(b.is_active) - Number(a.is_active));
        setCouriersByFlial((m) => ({ ...m, [flialId]: list }));
      } catch (e) {
        setCouriersErr((m) => ({
          ...m,
          [flialId]:
            e.response?.data?.detail || e.message || "Kuryerlar yuklanmadi",
        }));
        setCouriersByFlial((m) => ({ ...m, [flialId]: [] }));
      } finally {
        setCouriersLoading((m) => ({ ...m, [flialId]: false }));
      }
    },
    [couriersByFlial]
  );

  // Ensure selected courier exists in list
  const ensureCourierPresence = useCallback(
    async (flialId, courierId) => {
      if (!flialId || !courierId) return;
      const list = couriersByFlial[flialId] || [];
      const exists = list.some((c) => String(c.id) === String(courierId));
      if (exists) return;
      try {
        const one = await fetchCourierById(courierId);
        if (one) {
          const merged = [...list, one].sort(
            (a, b) => Number(b.is_active) - Number(a.is_active)
          );
          setCouriersByFlial((m) => ({ ...m, [flialId]: merged }));
        }
      } catch {
        // optional
      }
    },
    [couriersByFlial]
  );

  // Buyurtmalar kelgach, kuryer ro‘yxatlarini oldindan tayyorlab qo‘yish
  useEffect(() => {
    if (!Array.isArray(rows) || rows.length === 0) return;
    const flialIds = Array.from(
      new Set(rows.map((r) => r.flial_id).filter(Boolean))
    );
    Promise.all(flialIds.map((fid) => ensureCouriers(fid))).then(async () => {
      await Promise.all(
        rows
          .filter((r) => r.flial_id && r.courier_id)
          .map((r) => ensureCourierPresence(r.flial_id, r.courier_id))
      );
    });
  }, [rows, ensureCouriers, ensureCourierPresence]);

  // Filters
  const onChangeStatus = (e) =>
    setMultipleParams({ status: e.target.value, offset: 0 });
  const onChangeFlial = (e) =>
    setMultipleParams({ flial_id: e.target.value, offset: 0 });
  const onChangeLimit = (e) =>
    setMultipleParams({ limit: Number(e.target.value), offset: 0 });

  // Pagination (react-paginate)
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeTotal = Number.isFinite(total) ? total : null;
  const currentPage = Math.floor(qp.offset / qp.limit); // 0-index
  const pageCount = safeTotal != null ? Math.ceil(safeTotal / qp.limit) : null;

  const handlePageChange = (e) => {
    const selected = e?.selected ?? 0; // 0-index
    const nextOffset = selected * qp.limit;
    setParam("offset", nextOffset);
  };

  const goFirst = () => setParam("offset", 0);
  const goLast = () => {
    if (pageCount == null) return;
    const lastIndex = Math.max(0, pageCount - 1);
    const nextOffset = lastIndex * qp.limit;
    setParam("offset", nextOffset);
  };

  const onJumpSubmit = (e) => {
    e.preventDefault();
    if (pageCount == null) return;
    const n = Math.max(1, Math.min(pageCount, Number(jumpInput) || 1));
    const nextOffset = (n - 1) * qp.limit;
    setParam("offset", nextOffset);
  };

  // From–To indicator
  const from =
    safeTotal != null ? Math.min(qp.offset + 1, safeTotal) : qp.offset + 1;
  const to =
    safeTotal != null
      ? Math.min(qp.offset + safeRows.length, safeTotal)
      : qp.offset + safeRows.length;

  const money = (n) =>
    (typeof n === "number" ? n : Number(n))?.toLocaleString("uz-UZ");
  const openMap = (row) => {
    if (row?.latitude == null || row?.longitude == null) return;
    setSelected(row);
  };
  const closeMap = () => setSelected(null);

  // Save handlers
  const handleAssignFlial = async (order, newFlialId) => {
    const id = order.id;
    const ns = new Set(saving);
    ns.add(id);
    setSaving(ns);
    try {
      const updated = await patchOrderFlial(id, newFlialId);
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                flial_id: updated.flial_id ?? Number(newFlialId),
                flial_name: updated.flial_name ?? r.flial_name,
                courier_id: null,
              }
            : r
        )
      );
      if (newFlialId) await ensureCouriers(newFlialId);
    } catch (e) {
      alert(
        e.response?.data?.detail || e.message || "Filialni yangilab bo‘lmadi"
      );
    } finally {
      const nx = new Set(saving);
      nx.delete(id);
      setSaving(nx);
    }
  };

  const handleAssignCourier = async (order, newCourierIdStr) => {
    const id = order.id;
    const newCourierId = Number(newCourierIdStr);
    const ns = new Set(saving);
    ns.add(id);
    setSaving(ns);
    try {
      const updated = await patchOrderCourier(id, newCourierId);
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, courier_id: updated.courier_id ?? newCourierId }
            : r
        )
      );
    } catch (e) {
      alert(
        e.response?.data?.detail || e.message || "Kuryerni biriktirib bo‘lmadi"
      );
    } finally {
      const nx = new Set(saving);
      nx.delete(id);
      setSaving(nx);
    }
  };

  return (
    <div className="orders-page">
      {/* header & filters */}
      <div className="orders-header">
        <h2>Buyurtmalar</h2>
        <div className="filters">
          <label>
            <span>Status</span>
            <select value={qp.status} onChange={onChangeStatus}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s || "_"} value={s}>
                  {s || "—"}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Filial</span>
            <select
              value={qp.flial_id}
              onChange={onChangeFlial}
              disabled={flialsLoading || !!flialsErr}
            >
              <option value="">
                {flialsLoading ? "Yuklanmoqda..." : flialsErr ? "Xatolik" : "—"}
              </option>
              {flials.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Limit</span>
            <select value={qp.limit} onChange={onChangeLimit}>
              {[5, 10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <button
            className="btn reset"
            onClick={() => setSearchParams({}, { replace: true })}
          >
            Tozalash
          </button>
        </div>
      </div>

      <div className="orders-body">
        {loading ? (
          <div className="state">Yuklanmoqda...</div>
        ) : err ? (
          <div className="state error">{String(err)}</div>
        ) : safeRows.length === 0 ? (
          <div className="state">Ma’lumot yo‘q</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Telefon</th>
                  <th>Status</th>
                  <th>To‘lov</th>
                  <th>Kuryer</th>
                  <th>Filial</th>
                  <th>Boshlanish</th>
                  <th>Tayyor</th>
                  <th>Tugagan</th>
                  <th>Dostavka</th>
                  <th>Xarita</th>
                </tr>
              </thead>
              <tbody>
                {safeRows.map((r) => {
                  const hasGeo = r.latitude != null && r.longitude != null;
                  const flialId = r.flial_id || "";
                  const savingThis = saving.has(r.id);
                  const list = couriersByFlial[flialId] || [];
                  const couriersIsLoading = couriersLoading[flialId];
                  const couriersError = couriersErr[flialId];

                  return (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.phone || "-"}</td>
                      <td>
                        <span
                          className={`status status--${(
                            r.status ?? ""
                          ).toLowerCase()}`}
                        >
                          {r.status_text || r.status || "-"}
                        </span>
                      </td>
                      <td>
                        <span className="pill">
                          {/* payment_text bo‘lsa ko‘rsatamiz, aks holda type */}
                          {r.payment_text || r.payment_type || "-"}
                          {r.payment_status ? ` · ${r.payment_status}` : ""}
                        </span>
                      </td>

                      {/* Kuryer select */}
                      <td>
                        <div className="courier-select-wrap">
                          <select
                            className="courier-select"
                            value={
                              r.courier_id != null ? String(r.courier_id) : ""
                            }
                            onChange={(e) =>
                              handleAssignCourier(r, e.target.value)
                            }
                            disabled={
                              savingThis ||
                              !flialId ||
                              couriersIsLoading ||
                              !!couriersError
                            }
                            onFocus={async () => {
                              if (flialId) {
                                await ensureCouriers(flialId);
                                if (r.courier_id) {
                                  await ensureCourierPresence(
                                    flialId,
                                    r.courier_id
                                  );
                                }
                              }
                            }}
                          >
                            <option value="">
                              {flialId
                                ? couriersIsLoading
                                  ? "Yuklanmoqda..."
                                  : couriersError
                                  ? "Xatolik"
                                  : "— Kuryer tanlang —"
                                : "Avval filial tanlang"}
                            </option>

                            {list.map((c) => (
                              <option key={c.id} value={String(c.id)}>
                                {formatCourierName(c)}
                                {c.is_active ? "" : " (faol emas)"}
                              </option>
                            ))}
                          </select>

                          {couriersIsLoading && (
                            <span className="courier-spinner" />
                          )}
                        </div>
                      </td>

                      {/* Filial select */}
                      <td>
                        <select
                          value={flialId}
                          onChange={(e) => handleAssignFlial(r, e.target.value)}
                          disabled={savingThis || flialsLoading || !!flialsErr}
                        >
                          <option value="">
                            {flialsLoading
                              ? "Yuklanmoqda..."
                              : flialsErr
                              ? "Xatolik"
                              : "—"}
                          </option>
                          {flials.map((f) => (
                            <option key={f.id} value={String(f.id)}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>{r.start_datetime ?? "-"}</td>
                      <td>{r.ready_datetime ?? "-"}</td>
                      <td>{r.finish_datetime ?? "-"}</td>
                      <td>
                        {r.delivery_price != null
                          ? money(r.delivery_price)
                          : "-"}{" "}
                        so‘m
                      </td>
                      <td>
                        <button
                          className="icon-btn"
                          title={
                            hasGeo ? "Xaritada ko‘rish" : "Koordinata yo‘q"
                          }
                          disabled={!hasGeo}
                          onClick={() => openMap(r)}
                        >
                          <MapPin size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="orders-footer">
        <div className="page-info">
          {safeTotal != null ? (
            <>
              Ko‘rsatilayotgan: <b>{from}</b>–<b>{to}</b> / Jami:{" "}
              <b>{safeTotal}</b>
              {" · "}Sahifa: <b>{currentPage + 1}</b>/{pageCount}
            </>
          ) : (
            <>
              Offset: <b>{qp.offset}</b>, Limit: <b>{qp.limit}</b>, Ko‘rinyapti:{" "}
              <b>{safeRows.length}</b>
            </>
          )}
        </div>

        {pageCount != null && pageCount > 1 && (
          <div className="pagination-bar">
            <button
              className="pg-ctrl"
              onClick={goFirst}
              disabled={currentPage <= 0}
              aria-label="Birinchi sahifa"
              title="Birinchi sahifa"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              className="pg-ctrl"
              onClick={() =>
                handlePageChange({ selected: Math.max(0, currentPage - 1) })
              }
              disabled={currentPage <= 0}
              aria-label="Oldingi sahifa"
              title="Oldingi sahifa"
            >
              <ChevronLeft size={16} />
            </button>

            <ReactPaginate
              previousLabel={null}
              nextLabel={null}
              breakLabel={"..."}
              onPageChange={handlePageChange}
              forcePage={currentPage}
              pageCount={pageCount}
              marginPagesDisplayed={1}
              pageRangeDisplayed={3}
              containerClassName={"pagination"}
              pageClassName={"page-item"}
              pageLinkClassName={"page-link"}
              activeClassName={"active"}
              disabledClassName={"disabled"}
              renderOnZeroPageCount={null}
            />

            <button
              className="pg-ctrl"
              onClick={() =>
                handlePageChange({
                  selected: Math.min(pageCount - 1, currentPage + 1),
                })
              }
              disabled={currentPage >= pageCount - 1}
              aria-label="Keyingi sahifa"
              title="Keyingi sahifa"
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="pg-ctrl"
              onClick={goLast}
              disabled={currentPage >= pageCount - 1}
              aria-label="Oxirgi sahifa"
              title="Oxirgi sahifa"
            >
              <ChevronsRight size={16} />
            </button>

            <form className="jump-form" onSubmit={onJumpSubmit}>
              <span>Sahifaga o‘tish:</span>
              <input
                type="number"
                min={1}
                max={pageCount}
                value={jumpInput}
                onChange={(e) => setJumpInput(e.target.value)}
                placeholder={`${currentPage + 1}`}
                aria-label="Sahifa raqami"
              />
              <button className="btn" type="submit">
                O‘tish
              </button>
            </form>
          </div>
        )}
      </div>

      <MapModal open={!!selected} onClose={closeMap} order={selected} />
    </div>
  );
}
