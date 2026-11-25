import { supabaseAdmin } from "@/lib/supabaseAdmin.js";
import { deleteSupabaseStorageImage } from "@/lib/supabaseStorage.js";

function mapSupabaseProduct(row) {
  const extra = row.product_data || {};

  return {
    ...extra,
    id: row.legacy_mongo_id,
    name: row.name,
    description: row.description || "",
    desc: extra.desc || row.description || "",
    price: Number(row.price),
    mrp: Number(extra.mrp ?? row.price),
    category: row.category || "extra",
    stock: Number(row.stock_quantity ?? 0),
    image: row.image_url || "",
    available: row.is_available ?? true,
    badge: extra.badge || "",
    emoji: extra.emoji || "",
    rating: Number(extra.rating ?? 4.5),
    reviews: Number(extra.reviews ?? 0),
    tags: Array.isArray(extra.tags) ? extra.tags : [],
    features: Array.isArray(extra.features) ? extra.features : [],
  };
}

function mapProductToSupabase(product) {
  const {
    id,
    name,
    description,
    desc,
    price,
    mrp,
    category,
    stock,
    image,
    available,
    badge,
    emoji,
    rating,
    reviews,
    tags,
    features,
    ...otherFields
  } = product;

  return {
    legacy_mongo_id: String(id),
    name: String(name || "").trim(),
    description: String(desc ?? description ?? ""),
    price: Number(price) || 0,
    category: String(category || "extra"),
    stock_quantity: Math.max(0, Number(stock) || 0),
    image_url: image || null,
    is_available: available !== false,
    updated_at: new Date().toISOString(),
    product_data: {
      ...otherFields,
      desc: String(desc ?? description ?? ""),
      mrp: Number(mrp ?? price) || 0,
      badge: badge || "",
      emoji: emoji || "",
      rating: Number(rating) || 4.5,
      reviews: Number(reviews) || 0,
      tags: Array.isArray(tags) ? tags : [],
      features: Array.isArray(features) ? features : [],
    },
  };
}

let _cachedProducts = null;
let _cachedProductsTime = 0;
const PRODUCTS_CACHE_TTL_MS = 60000; // 60s in-memory cache

export function invalidateProductsCache() {
  _cachedProducts = null;
  _cachedProductsTime = 0;
}

export async function getSupabaseProducts(forceFresh = false) {
  const now = Date.now();
  if (!forceFresh && _cachedProducts && (now - _cachedProductsTime < PRODUCTS_CACHE_TTL_MS)) {
    return _cachedProducts;
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase products fetch timed out after 8s')), 8000)
    );
    const query = supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });

    const { data, error } = await Promise.race([query, timeoutPromise]);

    if (error) {
      if (_cachedProducts) {
        console.warn('Supabase products query failed, returning stale cache:', error.message);
        return _cachedProducts;
      }
      throw new Error(`Products fetch failed: ${error.message}`);
    }

    const mapped = (data || []).map(mapSupabaseProduct);
    _cachedProducts = mapped;
    _cachedProductsTime = Date.now();
    return mapped;
  } catch (err) {
    if (_cachedProducts) {
      console.warn('Supabase products error/timeout, using cached products:', err.message);
      return _cachedProducts;
    }
    throw err;
  }
}

export async function updateSupabaseProduct(product) {
  if (!product?.id) throw new Error("Product ID is required");

  const payload = mapProductToSupabase(product);

  // If image URL changed, delete previous Supabase storage file to save storage
  if (payload.image_url) {
    const { data: existing } = await supabaseAdmin
      .from("products")
      .select("image_url")
      .eq("legacy_mongo_id", String(product.id))
      .maybeSingle();

    if (existing?.image_url && existing.image_url !== payload.image_url) {
      deleteSupabaseStorageImage(existing.image_url).catch(() => {});
    }
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(payload)
    .eq("legacy_mongo_id", String(product.id))
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`Product update failed: ${error.message}`);
  if (!data) throw new Error("Product not found in Supabase");

  invalidateProductsCache();
  return mapSupabaseProduct(data);
}

export async function setSupabaseProductStock(id, stock) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .update({
      stock_quantity: Math.max(0, Number(stock) || 0),
      updated_at: new Date().toISOString(),
    })
    .eq("legacy_mongo_id", String(id))
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`Stock update failed: ${error.message}`);
  if (!data) throw new Error("Product not found in Supabase");

  invalidateProductsCache();
  return mapSupabaseProduct(data);
}

export async function setSupabaseProductImage(id, imageUrl) {
  // Check and delete previous Supabase storage image if replacing
  const { data: existing } = await supabaseAdmin
    .from("products")
    .select("image_url")
    .eq("legacy_mongo_id", String(id))
    .maybeSingle();

  if (existing?.image_url && existing.image_url !== imageUrl) {
    deleteSupabaseStorageImage(existing.image_url).catch(() => {});
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .update({
      image_url: imageUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("legacy_mongo_id", String(id))
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`Image update failed: ${error.message}`);
  if (!data) throw new Error("Product not found in Supabase");

  invalidateProductsCache();
  return mapSupabaseProduct(data);
}

export async function setSupabaseProductAvailability(id, available) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .update({
      is_available: Boolean(available),
      updated_at: new Date().toISOString(),
    })
    .eq("legacy_mongo_id", String(id))
    .select("*")
    .maybeSingle();

  if (error) throw new Error(`Availability update failed: ${error.message}`);
  if (!data) throw new Error("Product not found in Supabase");

  invalidateProductsCache();
  return mapSupabaseProduct(data);
}

export async function createSupabaseProduct(product) {
  if (!product?.id || !product?.name?.trim()) {
    throw new Error("Product ID and name are required");
  }

  const payload = mapProductToSupabase(product);

  const { data, error } = await supabaseAdmin
    .from("products")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw new Error(`Product creation failed: ${error.message}`);

  invalidateProductsCache();
  return mapSupabaseProduct(data);
}

export async function deleteSupabaseProduct(id) {
  const { data: existing } = await supabaseAdmin
    .from("products")
    .select("image_url")
    .eq("legacy_mongo_id", String(id))
    .maybeSingle();

  if (existing?.image_url) {
    deleteSupabaseStorageImage(existing.image_url).catch(() => {});
  }

  const { data, error } = await supabaseAdmin
    .from("products")
    .delete()
    .eq("legacy_mongo_id", String(id))
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Product deletion failed: ${error.message}`);

  invalidateProductsCache();
  if (!data) throw new Error("Product not found in Supabase");

  return true;
}

export async function hideSupabaseProduct(id) {
  const { data, error } = await supabaseAdmin
    .from("products")
    .update({
      is_available: false,
      updated_at: new Date().toISOString(),
    })
    .eq("legacy_mongo_id", String(id))
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Product hide failed: ${error.message}`);
  }

  if (!data) {
    throw new Error("Product not found in Supabase");
  }

  return true;
}
