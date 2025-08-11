import axios from "../api/axiosConfig";

/**
 * GET /orders/orders?limit=&offset=&status=&flial_id=
 * Backend nested qilib qaytaradi, bu yerda tekislaymiz.
 */
export async function fetchOrders(params) {
  const { status, flial_id, limit = 10, offset = 0 } = params;
  const qp = { limit: Number(limit), offset: Number(offset) };
  if (status) qp.status = status;
  if (flial_id) qp.flial_id = Number(flial_id);

  // Yangi endpoint
  const res = await axios.get("/orders/orders", { params: qp });
  const data = res.data || {};

  const raw = Array.isArray(data.orders) ? data.orders : [];

  // 👉 Tekislash (normalize) – Orders.jsx eski field’lar bilan ishlayveradi
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

      // geo (old style uchun)
      address: addr.address_text ?? null,
      latitude: addr.latitude ?? null,
      longitude: addr.longitude ?? null,

      // status (old style)
      status: st.status ?? null,
      status_text: st.status_text ?? null,

      // courier (old style)
      courier_id: cr.courier_id ?? null,
      courier_name: cr.courier_name ?? null,

      // payment (old style)
      delivery_price: o.delivery_price ?? null,
      payment_type: pay.payment_type ?? null,
      payment_status: pay.payment_status ?? null,
      payment_text: pay.payment_text ?? null,

      // flial (old style)
      flial_id: fl.flial_id ?? null,
      flial_name: fl.flial_name ?? null,

      // other
      mark: o.mark ?? null,
      comment: o.comment ?? null,

      // datetime (old style)
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
  const res = await axios.patch("/orders/flial/", null, {
    params: { order_id: Number(orderId), flial_id: Number(flialId) },
  });
  return res.data;
}

/**
 * PATCH /orders/courier/?order_id=&courier_id=
 */
export async function patchOrderCourier(orderId, courierId) {
  const res = await axios.patch("/orders/courier/", null, {
    params: { order_id: Number(orderId), courier_id: Number(courierId) },
  });
  return res.data;
}
