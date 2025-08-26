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

/**
 * Kategoriyani yangilash:
 * - Agar imageFile berilsa: multipart/form-data bilan yuboramiz (PUT /category/update)
 * - Aks holda: avvalgi kabi query-paramlar bilan yuboramiz
 */
export async function updateCategory({
  category_id,
  name_uz,
  name_ru,
  queue,
  row_number,
  imageFile, // NEW
}) {
  if (!category_id) throw new Error("category_id majburiy.");

  const params = { category_id };

  // string maydonlar (trim)
  if (typeof name_uz === "string" && name_uz.trim() !== "") {
    params.name_uz = name_uz.trim();
  }
  if (typeof name_ru === "string" && name_ru.trim() !== "") {
    params.name_ru = name_ru.trim();
  }

  // raqam maydonlar
  if (queue !== undefined && queue !== null && queue !== "") {
    const qn = Number(queue);
    if (Number.isFinite(qn)) params.queue = qn;
  }
  if (row_number !== undefined && row_number !== null && row_number !== "") {
    const rn = Number(row_number);
    if (Number.isFinite(rn)) params.row_number = rn;
  }

  // 🔑 Agar rasm bor bo‘lsa multipart orqali yuboramiz
  if (imageFile instanceof File) {
    const fd = new FormData();
    fd.append("image", imageFile);

    const { data } = await api.put("/category/update", fd, {
      params,
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }

  // Rasm yo‘q — eski yo‘l bilan (body=null, faqat params)
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
