import axios from "../api/axiosConfig";

// Backend tayyor bo‘lgach .env da yoqing:
// VITE_ENABLE_FLIAL_ACTIVE_API=true
const ACTIVE_API_ENABLED =
  (import.meta?.env?.VITE_ENABLE_FLIAL_ACTIVE_API ?? "").toString() === "true";

// Fallback uchun (API yo‘q bo‘lsa) localStorage
const LS_KEY = "flial_active_overrides_v1";
function getOverrides() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}
function setOverrides(obj) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(obj || {}));
  } catch {}
}

/** GET /flials */
export async function fetchFlials() {
  const res = await axios.get("/flials");
  const data = res.data;
  let list = [];
  if (data && Array.isArray(data.flials)) list = data.flials;
  else if (Array.isArray(data)) list = data;

  const overrides = getOverrides();
  return list.map((f) => ({
    id: f.id,
    name: f.name,
    latitude: f.latitude ?? null,
    longitude: f.longitude ?? null,
    coordinates: Array.isArray(f.coordinates) ? f.coordinates : [],
    // Backendda is_active bo‘lmasligi mumkin — default true yoki override
    is_active:
      typeof f.is_active === "boolean" ? f.is_active : overrides[f.id] ?? true,
  }));
}

/**
 * PATCH /flials/active/?flial_id=&is_active=
 * API bo‘lmasa fallback — localStorage
 */
export async function patchFlialActive(flialId, isActive) {
  const id = Number(flialId);
  const val = Boolean(isActive);

  if (ACTIVE_API_ENABLED) {
    try {
      const res = await axios.patch("/flials/active/", null, {
        params: { flial_id: id, is_active: val },
      });
      return res.data; // { flial_id, is_active } kutiladi
    } catch (e) {
      const code = e?.response?.status;
      // Endpoint hali qo‘yilmagan bo‘lsa, fallbackka tushamiz
      if (![404, 405, 501].includes(code)) {
        throw e;
      }
    }
  }

  // Fallback: local saqlash (mock)
  const overrides = getOverrides();
  overrides[id] = val;
  setOverrides(overrides);
  return { flial_id: id, is_active: val, __local: true };
}

/** POST /flials/polygon  -> { flial_id, coordinates: [[lat,lng], ...] } */
export async function saveFlialPolygon(flialId, coordinates) {
  const payload = {
    flial_id: Number(flialId),
    coordinates: Array.isArray(coordinates) ? coordinates : [],
  };
  const res = await axios.post("/flials/polygon", payload);
  return res.data;
}
