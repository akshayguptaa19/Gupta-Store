import { readFileSync, writeFileSync } from "node:fs";

const products = JSON.parse(
  readFileSync("./supabase-products-preview.json", "utf8").replace(/^\uFEFF/, "")
);

function sqlString(value) {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }
  return "'" + String(value).replace(/'/g, "''") + "'";
}

const ids = products.map(p => String(p.legacy_mongo_id));

if (products.length !== 51 || new Set(ids).size !== products.length) {
  throw new Error("Validation failed: expected 51 products with unique IDs.");
}

const statements = products.map(p => {
  const legacyId = sqlString(p.legacy_mongo_id);
  const name = sqlString(p.name);
  const description = sqlString(p.description);
  const category = sqlString(p.category);
  const imageUrl = sqlString(p.image_url);
  const price = Number(p.price);
  const stock = Number(p.stock_quantity);
  const available = Boolean(p.is_available);

  if (!p.name || !Number.isFinite(price) || !Number.isInteger(stock) || stock < 0) {
    throw new Error(`Invalid product data for ID ${p.legacy_mongo_id}`);
  }

  return `
INSERT INTO public.products
  (id, legacy_mongo_id, name, description, price, category,
   stock_quantity, image_url, is_available, created_at, updated_at)
SELECT
  gen_random_uuid(), ${legacyId}, ${name}, ${description}, ${price},
  ${category}, ${stock}, ${imageUrl}, ${available}, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.products
  WHERE legacy_mongo_id = ${legacyId}
);`;
});

writeFileSync(
  "./supabase-products-import.sql",
  statements.join("\n"),
  "utf8"
);

console.log("SQL file created: supabase-products-import.sql");
console.log("Products prepared:", products.length);
console.log("Duplicate IDs:", ids.length - new Set(ids).size);

