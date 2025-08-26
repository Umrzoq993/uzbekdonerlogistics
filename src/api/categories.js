// src/api/categories.js
import api from "./axiosConfig";

/** Kategoriyalar ro‘yxati */
export async function getCategories() {
  const { data } = await api.get("/category/all");
  return Array.isArray(data) ? data : [];
}

/** Bitta kategoriya */
export async function getCategoryById(category_id) {
  const { data } = await api.get("/category", { params: { category_id } });
  return data;
}

/** Yangi kategoriya: query(name_uz,name_ru) + body(multipart image) */
export async function createCategory({ name_uz, name_ru, imageFile }) {
  const fd = new FormData();
  if (imageFile) fd.append("image", imageFile);

  const { data } = await api.post("/category/new", fd, {
    params: { name_uz, name_ru },
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/** Kategoriyani yangilash: hamma maydonlar query orqali */
export async function updateCategory({
  category_id,
  name_uz,
  name_ru,
  queue,
  row_number,
}) {
  if (!category_id) throw new Error("category_id majburiy.");

  const params = { category_id };
  if (name_uz ?? "" !== "") params.name_uz = name_uz;
  if (name_ru ?? "" !== "") params.name_ru = name_ru;
  if (queue !== undefined && queue !== null && queue !== "")
    params.queue = Number(queue);
  if (row_number !== undefined && row_number !== null && row_number !== "")
    params.row_number = Number(row_number);

  const { data } = await api.put("/category/update", null, { params });
  return data;
}

/** Mahsulotlar: GET /product/by_category?category_id=ID -> { status, products } */
export async function getProductsByCategory(category_id, signal) {
  const { data } = await api.get("/product/by_category", {
    params: { category_id },
    signal,
  });

  const list =
    data?.status && Array.isArray(data?.products) ? data.products : [];

  // ixtiyoriy tartiblash: order -> nom
  return [...list].sort(
    (a, b) =>
      (a.order || 0) - (b.order || 0) ||
      String(a.name_uz || a.name_ru || a.name || "").localeCompare(
        String(b.name_uz || b.name_ru || b.name || "")
      )
  );
}
