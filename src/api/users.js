// src/api/users.js
import api from "./axiosConfig";

/** GET /all -> { status: true, users: [...] } */
export async function getUsers() {
  const { data } = await api.get("/all");
  if (data?.status && Array.isArray(data?.users)) return data.users;
  return [];
}

/** GET /user?user_id=:id -> { user } yoki { users:[{...}]} */
export async function getUserById(id) {
  const { data } = await api.get("/user", { params: { user_id: id } });
  if (data?.user) return data.user;
  if (Array.isArray(data?.users) && data.users.length) return data.users[0];
  return data;
}

/** POST /create_user  { full_name, username, password } */
export async function createUser({ full_name, username, password }) {
  const payload = { full_name, username, password };
  const { data } = await api.post("/create_user", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

/**
 * UPDATE /update  (query params orqali)
 * Majburiy: user_id
 * Ixtiyoriy: username, full_name, password
 * (server so‘rovi query orqali qabul qiladi, shuning uchun body = null)
 */
export async function updateUser({ user_id, username, full_name, password }) {
  if (!user_id) throw new Error("user_id majburiy.");
  const params = { user_id };
  if (username != null && username !== "") params.username = username;
  if (full_name != null && full_name !== "") params.full_name = full_name;
  if (password != null && password !== "") params.password = password;

  // Ko‘p serverlarda POST ishlatiladi; agar backend PUT talab qilsa, shu yerda .put ga almashtirasiz.
  const { data } = await api.post("/update", null, { params });
  return data;
}

/** TODO: O‘chirish endpointi kelsa shu yerga qo‘shamiz */
export async function deleteUser() {
  throw new Error("Delete endpoint berilmagan. Iltimos, API endpoint bering.");
}
