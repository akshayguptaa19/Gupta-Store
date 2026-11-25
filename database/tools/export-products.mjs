
import { writeFileSync } from "node:fs";
import { BASE_PRODUCTS } from "./src/lib/products.js";

const products = BASE_PRODUCTS;

const ids = products.map((p) => String(p.id));
const duplicateIds = ids.filter(
  (id, index) => ids.indexOf(id) !== index
);

writeFileSync(
  "./products-export.json",
  JSON.stringify(products, null, 2),
  "utf8"
);

console.log("Products exported:", products.length);
console.log("Duplicate IDs:", [...new Set(duplicateIds)]);
console.log(
  "Fields:",
  [...new Set(products.flatMap((p) => Object.keys(p)))]
);
console.log("File created: products-export.json");
