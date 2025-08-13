import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  fetchOrderById,
  patchOrderCourier,
  patchOrderFlial,
} from "../services/ordersService";
import { fetchFlials } from "../services/flialsService";
import {
  fetchCouriersByFlial,
  fetchCourierById,
} from "../services/couriersService";
import "./OrderDetailsModal.scss";

const row = (label, value) => (
  <div className="odm-row">
    <div className="odm-k">{label}</div>
    <div className="odm-v">{value ?? "-"}</div>
  </div>
);

// Kuryer nomini tozalash
const formatCourierName = (c) => {
  const raw = (c?.name ?? "").trim();
  return (
    raw.replace(/[\n\r]+/g, " · ").replace(/\s{2,}/g, " ") || `#${c?.id ?? ""}`
  );
};

export default function OrderDetailsModal({
  open,
  orderId,
  onClose,
  onUpdateOrder, // (id, patch) => void
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  // flial/kuryer state
  const [flials, setFlials] = useState([]);
  const [flialsLoading, setFlialsLoading] = useState(false);
  const [couriers, setCouriers] = useState([]);
  const [couriersLoading, setCouriersLoading] = useState(false);

  const [selFlial, setSelFlial] = useState("");
  const [selCourier, setSelCourier] = useState("");

  const [saving, setSaving] = useState(false);

  // Load order + flials when open
  useEffect(() => {
    if (!open || !orderId) return;
    let active = true;

    (async () => {
      setLoading(true);
      setError("");
      setOrder(null);
      try {
        const [ord, fls] = await Promise.all([
          fetchOrderById(orderId),
          (async () => {
            setFlialsLoading(true);
            try {
              const list = await fetchFlials();
              return list;
            } finally {
              setFlialsLoading(false);
            }
          })(),
        ]);

        if (!active) return;
        setOrder(ord);
        setFlials(fls);

        const flialId = ord?.flial?.flial_id ?? ord?.flial_id ?? "";
        const courierId = ord?.courier?.courier_id ?? ord?.courier_id ?? "";

        setSelFlial(flialId ? String(flialId) : "");
        setSelCourier(courierId ? String(courierId) : "");

        if (flialId) {
          setCouriersLoading(true);
          try {
            const list = await fetchCouriersByFlial(flialId);
            setCouriers(
              list.sort((a, b) => Number(b.is_active) - Number(a.is_active))
            );
          } finally {
            setCouriersLoading(false);
          }
        } else {
          setCouriers([]);
        }
      } catch (e) {
        if (!active) return;
        setError(
          e.response?.data?.detail || e.message || "Ma’lumotni olib bo‘lmadi"
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open, orderId]);

  // 🔁 Tanlangan kuryer ro‘yxatda bo‘lmasa, ID bo‘yicha olib qo‘shamiz (faol bo‘lmasa ham).
  useEffect(() => {
    if (!open) return;
    if (!selCourier) return;
    // allaqachon listda bo‘lsa skip
    const exists = couriers.some((c) => String(c.id) === String(selCourier));
    if (exists) return;

    let alive = true;
    (async () => {
      try {
        const one = await fetchCourierById(selCourier);
        if (!alive || !one) return;
        setCouriers((prev) => {
          const already = prev.some((c) => String(c.id) === String(one.id));
          if (already) return prev;
          const merged = [...prev, one].sort(
            (a, b) => Number(b.is_active) - Number(a.is_active)
          );
          return merged;
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, selCourier, couriers]);

  const addr = order?.address || {};
  const st = order?.status || {};
  const pay = order?.payment || {};
  const dt = order?.datetime || {};
  const items = Array.isArray(order?.details) ? order.details : [];

  const total = items.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.number) || 0),
    0
  );

  // Active-only + selected inactive
  const activeCouriers = useMemo(
    () => (Array.isArray(couriers) ? couriers.filter((c) => c.is_active) : []),
    [couriers]
  );

  const selectedInactiveCourier = useMemo(() => {
    if (!selCourier) return null;
    const found = couriers.find((c) => String(c.id) === String(selCourier));
    return found && !found.is_active ? found : null;
  }, [couriers, selCourier]);

  // Change flial -> PATCH -> update parent + reload couriers
  const onChangeFlial = useCallback(
    async (e) => {
      const newFlialId = e.target.value;
      setSelFlial(newFlialId);
      setSaving(true);
      try {
        await patchOrderFlial(orderId, newFlialId);
        // Parent jadvalni yangilash
        onUpdateOrder?.(orderId, {
          flial_id: Number(newFlialId),
          flial_name:
            flials.find((f) => String(f.id) === String(newFlialId))?.name ||
            null,
          courier_id: null,
          courier_name: null,
        });

        // Local state: kuryer reset + yangi ro‘yxat
        setSelCourier("");
        setCouriersLoading(true);
        try {
          const list = await fetchCouriersByFlial(newFlialId);
          setCouriers(
            list.sort((a, b) => Number(b.is_active) - Number(a.is_active))
          );
        } finally {
          setCouriersLoading(false);
        }
      } catch (err) {
        alert(
          err.response?.data?.detail ||
            err.message ||
            "Filialni yangilab bo‘lmadi"
        );
      } finally {
        setSaving(false);
      }
    },
    [orderId, onUpdateOrder, flials]
  );

  // Change courier -> PATCH -> update parent
  const onChangeCourier = useCallback(
    async (e) => {
      const newCourierId = e.target.value;
      setSelCourier(newCourierId);
      setSaving(true);
      try {
        await patchOrderCourier(orderId, newCourierId);
        // name-ni olish
        let name = "";
        try {
          const one = await fetchCourierById(newCourierId);
          name = one?.name || "";
        } catch {
          const inList = couriers.find(
            (c) => String(c.id) === String(newCourierId)
          );
          name = inList ? inList.name : "";
        }
        onUpdateOrder?.(orderId, {
          courier_id: Number(newCourierId),
          courier_name: name || null,
        });
      } catch (err) {
        alert(
          err.response?.data?.detail ||
            err.message ||
            "Kuryerni yangilab bo‘lmadi"
        );
      } finally {
        setSaving(false);
      }
    },
    [orderId, onUpdateOrder, couriers]
  );

  if (!open) return null;

  return (
    <div className="odm-backdrop" onClick={onClose}>
      <div className="odm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="odm-head">
          <h3>Buyurtma #{order?.id ?? orderId}</h3>
          <button className="odm-close" onClick={onClose} aria-label="Yopish">
            ×
          </button>
        </div>

        {loading ? (
          <div className="odm-state">Yuklanmoqda...</div>
        ) : error ? (
          <div className="odm-state odm-error">{String(error)}</div>
        ) : (
          <>
            <div className="odm-grid">
              {row("Status", st.status_text || st.status)}
              {row("Telefon", order?.phone)}
              {row("Foydalanuvchi ID", order?.user_id)}
              {row("Manzil", addr.address_text)}
              {row("Boshlanish", dt.start_datetime)}
              {row("Tayyor", dt.ready_datetime)}
              {row("Tugagan", dt.finish_datetime)}
              {row("Izoh", order?.comment)}

              {/* ——— Tahrir: Filial ——— */}
              <div className="odm-row">
                <div className="odm-k">Filialni o‘zgartirish</div>
                <div className="odm-v">
                  <select
                    value={selFlial}
                    onChange={onChangeFlial}
                    disabled={flialsLoading || saving}
                  >
                    <option value="">
                      {flialsLoading ? "Yuklanmoqda..." : "— Tanlang —"}
                    </option>
                    {flials.map((f) => (
                      <option key={f.id} value={String(f.id)}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ——— Tahrir: Kuryer ——— */}
              <div className="odm-row">
                <div className="odm-k">Kuryerni biriktirish</div>
                <div className="odm-v">
                  <select
                    value={selCourier}
                    onChange={onChangeCourier}
                    disabled={!selFlial || couriersLoading || saving}
                  >
                    <option value="">
                      {!selFlial
                        ? "Avval filialni tanlang"
                        : couriersLoading
                        ? "Yuklanmoqda..."
                        : "— Tanlang —"}
                    </option>

                    {/* Tanlangan, ammo nofaol kuryer (alohida ko‘rsatamiz) */}
                    {selectedInactiveCourier && (
                      <option value={String(selectedInactiveCourier.id)}>
                        {`${formatCourierName(
                          selectedInactiveCourier
                        )} (faol emas)`}
                      </option>
                    )}

                    {/* Faqat faol kuryerlar ro‘yxati */}
                    {activeCouriers.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        {formatCourierName(c)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="odm-subtitle">Tarkib (mahsulotlar)</div>
            <div className="odm-items">
              <table>
                <thead>
                  <tr>
                    <th>Mahsulot</th>
                    <th>Narx</th>
                    <th>Soni</th>
                    <th>Jami</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const price = Number(it.price) || 0;
                    const cnt = Number(it.number) || 0;
                    const sum = price * cnt;
                    return (
                      <tr key={idx}>
                        <td>{it.product}</td>
                        <td>{price.toLocaleString("uz-UZ")} so‘m</td>
                        <td>{cnt}</td>
                        <td>{sum.toLocaleString("uz-UZ")} so‘m</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td
                      colSpan={3}
                      style={{ textAlign: "right", fontWeight: 600 }}
                    >
                      Jami:
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {total.toLocaleString("uz-UZ")} so‘m
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
