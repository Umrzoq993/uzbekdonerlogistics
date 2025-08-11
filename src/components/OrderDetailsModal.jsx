import React from "react";

const row = (label, value) => (
  <div className="odm-row">
    <div className="odm-k">{label}</div>
    <div className="odm-v">{value ?? "-"}</div>
  </div>
);

export default function OrderDetailsModal({
  open,
  loading,
  error,
  data,
  onClose,
}) {
  if (!open) return null;

  const o = data || {};
  const addr = o.address || {};
  const st = o.status || {};
  const cr = o.courier || {};
  const pay = o.payment || {};
  const fl = o.flial || {};
  const dt = o.datetime || {};
  const items = Array.isArray(o.details) ? o.details : [];

  const total = items.reduce(
    (s, it) => s + (Number(it.price) || 0) * (Number(it.number) || 0),
    0
  );

  return (
    <div className="odm-backdrop" onClick={onClose}>
      <div className="odm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="odm-head">
          <h3>Buyurtma #{o.id ?? "—"}</h3>
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
              {row("Telefon", o.phone)}
              {row("Foydalanuvchi ID", o.user_id)}
              {row("Filial", fl.flial_name)}
              {row("Kuryer", cr.courier_name)}
              {row(
                "To‘lov",
                [pay.payment_text || pay.payment_type, pay.payment_status]
                  .filter(Boolean)
                  .join(" · ")
              )}
              {row("Manzil", addr.address_text)}
              {row("Boshlanish", dt.start_datetime)}
              {row("Tayyor", dt.ready_datetime)}
              {row("Tugagan", dt.finish_datetime)}
              {row("Izoh", o.comment)}
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
