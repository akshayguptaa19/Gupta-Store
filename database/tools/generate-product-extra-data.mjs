import { readFileSync, writeFileSync } from "node:fs";

const products = JSON.parse(
  readFileSync("./products-export.json", "utf8").replace(/^\uFEFF/, "")
);

if (products.length !== 50 || new Set(products.map(p => String(p.id))).size !== 50) {
  throw new Error("Validation failed: expected 50 products with unique IDs.");
}

function sqlString(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

const statements = products.map(p => {
  const id = sqlString(String(p.id));
  const extraData = {
    mrp: p.mrp ?? null,
    emoji: p.emoji ?? "",
    badge: p.badge ?? "",
    rating: p.rating ?? null,
    reviews: p.reviews ?? 0,
    tags: p.tags ?? [],
    features: p.features ?? []
  };

  return `
UPDATE public.products
SET product_data = ${sqlString(JSON.stringify(extraData))}::jsonb
WHERE legacy_mongo_id = ${id}
  AND name = ${sqlString(p.name)};
`;
});

writeFileSync(
  "./supabase-product-extra-data.sql",
  statements.join("\n"),
  "utf8"
);

console.log("SQL file created: supabase-product-extra-data.sql");
console.log("Products prepared:", products.length);
