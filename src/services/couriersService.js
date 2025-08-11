import axios from "../api/axiosConfig";

/**
 * Flial bo‘yicha kuryerlar:
 * GET /couriers/flial?flial_id=1
 * {
 *   couriers: [
 *     { courier_id, name, flial_id, is_active }
 *   ]
 * }
 * UI uchun: { id, name, flial_id, is_active }
 */
export async function fetchCouriersByFlial(flialId) {
  const res = await axios.get("/couriers/flial", {
    params: { flial_id: Number(flialId) },
  });
  const list = Array.isArray(res.data?.couriers) ? res.data.couriers : [];
  return list.map((c) => ({
    id: c.courier_id, // normalize
    name: typeof c.name === "string" ? c.name : "",
    flial_id: c.flial_id ?? Number(flialId),
    is_active: Boolean(c.is_active),
  }));
}

/**
 * Bitta kuryer ID bo‘yicha:
 * GET /couriers/?courier_id=767950545
 * {
 *   "courier_id": 767950545,
 *   "name": "....",
 *   "flial_id": 1,
 *   "is_active": true
 * }
 */
export async function fetchCourierById(courierId) {
  const res = await axios.get("/couriers/", {
    params: { courier_id: Number(courierId) },
  });
  const c = res.data || {};
  return {
    id: c.courier_id ?? Number(c.id ?? courierId),
    name: typeof c.name === "string" ? c.name : "",
    flial_id: c.flial_id ?? null,
    is_active: Boolean(c.is_active),
  };
}
