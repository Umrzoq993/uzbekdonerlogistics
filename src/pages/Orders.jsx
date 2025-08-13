import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ReactPaginate from "react-paginate";
import { fetchOrders, fetchOrderStatuses } from "../services/ordersService";
import MapModal from "../components/MapModal";
import OrderDetailsModal from "../components/OrderDetailsModal";
import {
  MapPin,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
  Info,
} from "lucide-react";
import { fetchFlials } from "../services/flialsService";
import "./orders.scss";

const DEFAULT_STATUS_OPTIONS = [{ value: "", label: "—" }];

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams();

  const qp = useMemo(() => {
    const status = searchParams.get("status") || "";
    const flial_id = searchParams.get("flial_id") || "";
    const phone = searchParams.get("phone") || "";
    const courier_id = searchParams.get("courier_id") || "";
    const limit = Number(searchParams.get("limit") || 10);
    const offset = Number(searchParams.get("offset") || 0);
    return { status, flial_id, phone, courier_id, limit, offset };
  }, [searchParams]);

  // Data
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(null);

  // UI
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Flials (filter uchun)
  const [flials, setFlials] = useState([]);
  const [flialsLoading, setFlialsLoading] = useState(false);
  const [flialsErr, setFlialsErr] = useState("");

  // Status options
  const [statusOptions, setStatusOptions] = useState(DEFAULT_STATUS_OPTIONS);
  const [statusesErr, setStatusesErr] = useState("");

  // Map & details
  const [selected, setSelected] = useState(null); // MapModal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsId, setDetailsId] = useState(null);

  // Text filter draft’lari
  const [phoneDraft, setPhoneDraft] = useState(qp.phone || "");
  const [courierDraft, setCourierDraft] = useState(qp.courier_id || "");

  // Jump-to-page local state
  const [jumpInput, setJumpInput] = useState("");

  useEffect(() => setPhoneDraft(qp.phone || ""), [qp.phone]);
  useEffect(() => setCourierDraft(qp.courier_id || ""), [qp.courier_id]);

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

  // Status options
  useEffect(() => {
    (async () => {
      try {
        const opts = await fetchOrderStatuses();
        setStatusOptions(opts);
        setStatusesErr("");
      } catch (e) {
        setStatusesErr(
          e.response?.data?.detail || e.message || "Statuslar yuklanmadi"
        );
        setStatusOptions(DEFAULT_STATUS_OPTIONS);
      }
    })();
  }, []);

  // Flials list (filter uchun)
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

  // Orders on filters/pagination
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
  }, [qp.status, qp.flial_id, qp.phone, qp.courier_id, qp.limit, qp.offset]);

  // Pagination
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

  // Filters
  const onChangeStatus = (e) =>
    setMultipleParams({ status: e.target.value, offset: 0 });
  const onChangeFlial = (e) =>
    setMultipleParams({ flial_id: e.target.value, offset: 0 });
  const onChangeLimit = (e) =>
    setMultipleParams({ limit: Number(e.target.value), offset: 0 });

  const applyTextFilters = () => {
    const phone = phoneDraft.trim();
    const courier_id = courierDraft.trim();
    setMultipleParams({ phone, courier_id, offset: 0 });
  };

  const onKeyDownText = (e) => {
    if (e.key === "Enter") applyTextFilters();
  };

  // Jump submit
  const onJumpSubmit = (e) => {
    e.preventDefault();
    if (pageCount == null) return;
    const n = Math.max(1, Math.min(pageCount, Number(jumpInput) || 1));
    const nextOffset = (n - 1) * qp.limit;
    setParam("offset", nextOffset);
    setJumpInput("");
  };

  // From–To
  const from =
    safeTotal != null ? Math.min(qp.offset + 1, safeTotal) : qp.offset + 1;
  const to =
    safeTotal != null
      ? Math.min(qp.offset + safeRows.length, safeTotal)
      : qp.offset + safeRows.length;

  // Map helpers
  const money = (n) =>
    (typeof n === "number" ? n : Number(n))?.toLocaleString("uz-UZ");
  const openMap = (row) => {
    if (row?.latitude == null || row?.longitude == null) return;
    setSelected(row);
  };
  const closeMap = () => setSelected(null);

  // Details
  const openDetails = (id) => {
    setDetailsId(id);
    setDetailsOpen(true);
  };
  const closeDetails = () => setDetailsOpen(false);

  // Patch back into table from modal
  const applyOrderPatch = useCallback((id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  return (
    <div className="orders-page">
      {/* header & filters */}
      <div className="orders-header">
        <h2>Buyurtmalar</h2>
        <div className="filters">
          <label>
            <span>Status</span>
            <select value={qp.status} onChange={onChangeStatus}>
              {(statusesErr ? DEFAULT_STATUS_OPTIONS : statusOptions).map(
                (opt) => (
                  <option key={opt.value || "_"} value={opt.value}>
                    {opt.label}
                  </option>
                )
              )}
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
            <span>Telefon</span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="+998"
              value={phoneDraft}
              onChange={(e) => setPhoneDraft(e.target.value)}
              onKeyDown={onKeyDownText}
            />
          </label>

          <label>
            <span>Kuryer ID</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="12345"
              value={courierDraft}
              onChange={(e) => setCourierDraft(e.target.value)}
              onKeyDown={onKeyDownText}
            />
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

          <button className="btn" onClick={applyTextFilters}>
            Qidirish
          </button>

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
                  <th>Dostavka</th>
                  <th>Xarita</th>
                  <th>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {safeRows.map((r) => {
                  const hasGeo = r.latitude != null && r.longitude != null;
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
                          {r.payment_text || r.payment_type || "-"}
                          {r.payment_status ? ` · ${r.payment_status}` : ""}
                        </span>
                      </td>

                      <td>
                        {r.courier_name ||
                          (r.courier_id ? `#${r.courier_id}` : "—")}
                      </td>
                      <td>
                        {r.flial_name || (r.flial_id ? `#${r.flial_id}` : "—")}
                      </td>

                      <td>
                        {r.delivery_price != null
                          ? `${money(r.delivery_price)} so‘m`
                          : "-"}
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

                      <td>
                        <button
                          className="action-btn"
                          title="Batafsil"
                          onClick={() => openDetails(r.id)}
                        >
                          <Info size={18} />
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
            {/* Per-page (tezkor) */}
            <div className="perpage">
              <span>Ko‘rsatish:</span>
              <select
                value={qp.limit}
                onChange={onChangeLimit}
                aria-label="Bir sahifadagi qatorlar"
              >
                {[5, 10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* First/Prev */}
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

            {/* Page list */}
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

            {/* Next/Last */}
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

            {/* Jump-to-page */}
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

      {/* Modallar */}
      <MapModal open={!!selected} onClose={closeMap} order={selected} />
      <OrderDetailsModal
        open={detailsOpen}
        orderId={detailsId}
        onClose={closeDetails}
        onUpdateOrder={applyOrderPatch}
      />
    </div>
  );
}
