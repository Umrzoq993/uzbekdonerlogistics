import api from "../api/axiosConfig";

/** Normalize */
const normalize = (c) => ({
  id: c.category_id,
  name_uz: c.name_uz ?? "",
  name_ru: c.name_ru ?? "",
  photo: c.photo ?? "", // <-- URL
  queue: typeof c.queue === "number" ? c.queue : Number(c.queue ?? 0),
  row_number:
    typeof c.row_number === "number" ? c.row_number : Number(c.row_number ?? 0),
});

/** GET /category/all */
export async function fetchCategories() {
  const res = await api.get("/category/all");
  const list = Array.isArray(res.data) ? res.data : [];
  return list.map(normalize);
}

/** GET /category/?category_id= */
export async function fetchCategoryById(id) {
  const res = await api.get("/category/", {
    params: { category_id: Number(id) },
  });
  return normalize(res.data || {});
}

/** POST /category/new  (multipart/form-data) */
export async function createCategory(payload) {
  const fd = new FormData();
  fd.append("name_uz", payload.name_uz ?? "");
  fd.append("name_ru", payload.name_ru ?? "");
  fd.append("queue", String(Number(payload.queue ?? 0)));
  fd.append("row_number", String(Number(payload.row_number ?? 0)));

  // PHOTO: fayl majburiy bo‘lsa, shartni tekshiring. Hozir ixtiyoriy.
  if (payload.photoFile instanceof File) {
    fd.append("photo", payload.photoFile, payload.photoFile.name);
  }

  const res = await api.post(
    "/category/new",
    fd /* axios boundary’ni o‘zi qo‘yadi */
  );
  const data = res.data?.category || res.data;
  return normalize(data);
}

/** PATCH /category/
 *  Agar photoFile berilsa — multipart; aks holda avvalgidek params bilan PATCH.
 */
export async function updateCategory(id, patch) {
  // PHOTO bilan yangilash (multipart)
  if (patch.photoFile instanceof File) {
    const fd = new FormData();
    fd.append("category_id", String(Number(id)));
    if (patch.name_uz != null) fd.append("name_uz", patch.name_uz);
    if (patch.name_ru != null) fd.append("name_ru", patch.name_ru);
    if (patch.queue != null) fd.append("queue", String(Number(patch.queue)));
    if (patch.row_number != null)
      fd.append("row_number", String(Number(patch.row_number)));
    fd.append("photo", patch.photoFile, patch.photoFile.name);

    const res = await api.patch("/category/", fd);
    const data = res.data?.category || res.data;
    return normalize(data);
  }

  // PHOTO yo‘q — eski uslub (query params) bilan patch
  const params = { category_id: Number(id) };
  if (patch.name_uz != null) params.name_uz = patch.name_uz;
  if (patch.name_ru != null) params.name_ru = patch.name_ru;
  if (patch.queue != null) params.queue = Number(patch.queue);
  if (patch.row_number != null) params.row_number = Number(patch.row_number);

  const res = await api.patch("/category/", null, { params });
  const data = res.data?.category || res.data;
  return normalize(data);
}

/** DELETE /category/?category_id= */
export async function deleteCategory(id) {
  await api.delete("/category/", { params: { category_id: Number(id) } });
}

/** row_number/queue ni batch saqlash */
export async function saveOrderBatch(rows) {
  for (const r of rows) {
    await updateCategory(r.id, {
      row_number: r.row_number,
      queue: r.queue,
    });
  }
}
