// src/api/products.js
import api from "./axiosConfig";

/**
 * Yangi mahsulot: POST /product/new
 * Barcha maydonlar query orqali, rasm esa multipart/form-data body orqali.
 */
export async function createProduct({
  iiko_product_id,
  name_uz,
  name_ru,
  price,
  category_id,
  description_uz,
  description_ru,
  imageFile, // majburiy
}) {
  if (!imageFile) throw new Error("Rasm (image) majburiy.");

  const params = {
    iiko_product_id,
    name_uz,
    name_ru,
    price: Number(price),
    category_id: Number(category_id),
    description_uz,
    description_ru,
  };

  const fd = new FormData();
  fd.append("image", imageFile);

  const { data } = await api.put("/product/new", fd, {
    params,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * Mahsulotni yangilash: POST /product/update
 * Hammasi query’da, rasm ixtiyoriy body’da (multipart).
 */
export async function updateProduct({
  product_id,
  iiko_product_id,
  name_uz,
  name_ru,
  price,
  category_id,
  description_uz,
  description_ru,
  active, // boolean | undefined
  order_by, // number  | undefined
  imageFile, // File | undefined
}) {
  if (!product_id) throw new Error("product_id majburiy.");

  const params = { product_id: Number(product_id) };

  if (iiko_product_id ?? "" !== "") params.iiko_product_id = iiko_product_id;
  if (name_uz ?? "" !== "") params.name_uz = name_uz;
  if (name_ru ?? "" !== "") params.name_ru = name_ru;
  if (price !== undefined && price !== null && price !== "")
    params.price = Number(price);
  if (category_id !== undefined && category_id !== null && category_id !== "")
    params.category_id = Number(category_id);
  if (description_uz ?? "" !== "") params.description_uz = description_uz;
  if (description_ru ?? "" !== "") params.description_ru = description_ru;
  if (typeof active === "boolean") params.active = active;
  if (order_by !== undefined && order_by !== null && order_by !== "")
    params.order_by = Number(order_by);

  const fd = new FormData();
  if (imageFile) fd.append("image", imageFile);

  const { data } = await api.put("/product/update", fd, {
    params,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
