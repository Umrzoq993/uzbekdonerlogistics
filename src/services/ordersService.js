import axios from "../api/axiosConfig";

export async function fetchOrders(params) {
  const { status, flial_id, limit = 10, offset = 0 } = params;
  const qp = { limit: Number(limit), offset: Number(offset) };
  if (status) qp.status = status;
  if (flial_id) qp.flial_id = Number(flial_id);

  const res = await axios.get("/orders", { params: qp });
  const data = res.data;

  // Backend ko‘rinishlari:
  // 1) { orders: [...], total_rows, current_page, total_pages }
  // 2) { items: [...], total }
  // 3) [...array]
  if (data && Array.isArray(data.orders)) {
    return {
      items: data.orders,
      total:
        typeof data.total_rows === "number"
          ? data.total_rows
          : data.orders.length,
    };
  }
  if (data && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: typeof data.total === "number" ? data.total : data.items.length,
    };
  }
  if (Array.isArray(data)) {
    return { items: data, total: data.length };
  }
  return { items: [], total: 0 };
}

export async function patchOrderFlial(orderId, flialId) {
  const res = await axios.patch("/orders/flial/", null, {
    params: { order_id: Number(orderId), flial_id: Number(flialId) },
  });
  return res.data;
}

export async function patchOrderCourier(orderId, courierId) {
  const res = await axios.patch("/orders/courier/", null, {
    params: { order_id: Number(orderId), courier_id: Number(courierId) },
  });
  return res.data;
}
