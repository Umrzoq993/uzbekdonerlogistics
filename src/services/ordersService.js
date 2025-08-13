import axios from "../api/axiosConfig";

/**
 * GET /orders/orders?limit=&offset=&status=&flial_id=
 * Backend nested qilib qaytaradi, bu yerda tekislaymiz.
 */

/** GET /orders/orders?limit=&offset=&status=&flial_id=&phone=&courier_id= */
export async function fetchOrders(params) {
  const {
    status,
    flial_id,
    limit = 10,
    offset = 0,
    phone,
    courier_id,
  } = params;

  const qp = { limit: Number(limit), offset: Number(offset) };
  if (status) qp.status = status;
  if (flial_id) qp.flial_id = Number(flial_id);
  if (phone) qp.phone = String(phone).trim();
  if (courier_id != null && String(courier_id).trim() !== "") {
    const cid = Number(courier_id);
    if (Number.isFinite(cid)) qp.courier_id = cid;
  }

  const res = await axios.get("/orders/orders", { params: qp });
  const data = res.data || {};
  const raw = Array.isArray(data.orders) ? data.orders : [];

  const items = raw.map((o) => {
    const addr = o.address || {};
    const st = o.status || {};
    const cr = o.courier || {};
    const pay = o.payment || {};
    const fl = o.flial || {};
    const dt = o.datetime || {};
    return {
      id: o.id,
      user_id: o.user_id ?? null,
      phone: o.phone ?? null,
      address: addr.address_text ?? null,
      latitude: addr.latitude ?? null,
      longitude: addr.longitude ?? null,
      status: st.status ?? null,
      status_text: st.status_text ?? null,
      courier_id: cr.courier_id ?? null,
      courier_name: cr.courier_name ?? null,
      delivery_price: o.delivery_price ?? null,
      payment_type: pay.payment_type ?? null,
      payment_status: pay.payment_status ?? null,
      payment_text: pay.payment_text ?? null,
      flial_id: fl.flial_id ?? null,
      flial_name: fl.flial_name ?? null,
      mark: o.mark ?? null,
      comment: o.comment ?? null,
      start_datetime: dt.start_datetime ?? null,
      ready_datetime: dt.ready_datetime ?? null,
      finish_datetime: dt.finish_datetime ?? null,
    };
  });

  const total =
    typeof data.total_rows === "number"
      ? data.total_rows
      : typeof data.total === "number"
      ? data.total
      : items.length;

  return { items, total };
}

/**
 * PATCH /orders/flial/?order_id=&flial_id=
 * Backend javobida ham nested/tekis bo‘lishi mumkin — bu funksiya Orders.jsx’da
 * faqat qaytgan qiymatlarni qo‘yish uchun ishlatiladi.
 */
export async function patchOrderFlial(orderId, flialId) {
  const res = await axios.put("/orders/flial/", null, {
    params: { order_id: Number(orderId), flial_id: Number(flialId) },
  });
  return res.data;
}

/**
 * PATCH /orders/courier/?order_id=&courier_id=
 */
export async function patchOrderCourier(orderId, courierId) {
  const res = await axios.put("/orders/courier/", null, {
    params: { order_id: Number(orderId), courier_id: Number(courierId) },
  });
  return res.data;
}

//: statuslar ro'yxati
export async function fetchOrderStatuses() {
  const res = await axios.get("/orders/statuses");
  // backend: { waiting: "⏳ Kutish holatida", ... }
  const obj = res.data || {};
  // UI uchun massiv: [{value:'', label:'—'}, {value:'waiting', label:'⏳ Kutish holatida'}, ...]
  const entries = Object.entries(obj).map(([value, label]) => ({
    value,
    label,
  }));
  // Tartib: waiting -> confirmed -> rejected -> onway -> received (kelgan tartibda ham qoldirsa bo'ladi)
  return [{ value: "", label: "—" }, ...entries];
}

//: Buyurtma detali
export async function fetchOrderById(orderId) {
  const res = await axios.get("/orders/order", {
    params: { order_id: Number(orderId) },
  });
  // backend: { order: {...} }
  return res.data?.order || null;
}
