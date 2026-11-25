
import fs from "node:fs";

const defaults = JSON.parse(
  fs.readFileSync("./products-export.json", "utf8")
);

const catalog = JSON.parse(
  fs.readFileSync(
    `${process.env.USERPROFILE}\\Documents\\GuptaStore-Migration-Backup\\product_store.json`,
    "utf8"
  )
);

const byId = new Map(
  defaults.map((p) => [String(p.id), { ...p }])
);

// Apply overrides only to products that already exist.
for (const [id, override] of Object.entries(catalog.overrides ?? {})) {
  const product = byId.get(String(id));
  if (!product) {
    throw new Error(`Override ID ${id} not found in default products`);
  }
  
Object.assign(product, {
  ...override,
  id: product.id,
  price: Number(
    override.price?.$numberInt ?? override.price
  ),
  mrp: Number(
    override.mrp?.$numberInt ?? override.mrp ?? product.mrp
  ),
  stock: product.stock
});

}

// Apply explicit stock and image maps.
for (const [id, stock] of Object.entries(catalog.stocks ?? {})) {
  const product = byId.get(String(id));
  if (product) product.stock = stock?.$numberInt
    ? Number(stock.$numberInt)
    : Number(stock);
}

for (const [id, image] of Object.entries(catalog.images ?? {})) {
  const product = byId.get(String(id));
  if (product && !catalog.overrides?.[id]?.image) {
    product.image = image;
  }
}

// Add custom products without changing their source IDs.
for (const custom of catalog.customs ?? []) {
  const id = custom.id?.$numberDouble
    ? String(Number(custom.id.$numberDouble))
    : String(custom.id);

  if (byId.has(id)) {
    throw new Error(`Custom product ID ${id} already exists`);
  }

  byId.set(id, {
    id,
    name: custom.name,
    price: Number(custom.price?.$numberInt ?? custom.price),
    mrp: Number(custom.mrp?.$numberInt ?? custom.mrp),
    category: custom.category,
    stock: Number(custom.stock?.$numberInt ?? custom.stock),
    image: custom.image,
    desc: custom.desc,
    emoji: "🛍️",
    badge: custom.badge ?? "",
    rating: Number(custom.rating?.$numberDouble ?? custom.rating ?? 0),
    reviews: Number(custom.reviews?.$numberInt ?? custom.reviews ?? 0),
    tags: custom.tags ?? [],
    features: custom.features ?? []
  });
}

const normalized = [...byId.values()].map((p) => ({
  legacy_mongo_id: String(p.id),
  name: String(p.name),
  description: p.desc ?? "",
  price: Number(p.price),
  category: p.category ?? "other",
  stock_quantity: Number(p.stock ?? 0),
  image_url: p.image ?? null,
  is_available: Number(p.stock ?? 0) > 0
}));

const invalid = normalized.filter(
  (p) => !p.legacy_mongo_id || !p.name || !Number.isFinite(p.price)
    || !Number.isInteger(p.stock_quantity)
);

if (invalid.length) {
  console.error("Invalid products:", invalid);
  process.exit(1);
}

fs.writeFileSync(
  "./supabase-products-preview.json",
  JSON.stringify(normalized, null, 2),
  "utf8"
);

console.log("Normalized product count:", normalized.length);
console.log("Product 29:", normalized.find((p) => p.legacy_mongo_id === "29"));
console.log(
  "Writometer:",
  normalized.find((p) => p.legacy_mongo_id === "1792401238113")
);
console.log("Preview created: supabase-products-preview.json");
