
import fs from "node:fs";

const products = JSON.parse(
  fs.readFileSync("./products-export.json", "utf8")
);

const ids = new Set(products.map((p) => String(p.id)));

const report = {
  totalDefaultProducts: products.length,
  duplicateIds: products
    .map((p) => String(p.id))
    .filter((id, i, all) => all.indexOf(id) !== i),
  hasProduct29: ids.has("29"),
  hasWritometerId: ids.has("1792401238113"),
  sampleProducts: products.slice(0, 5).map((p) => ({
    id: String(p.id),
    name: p.name,
    price: p.price,
    stock: p.stock,
    image: p.image
  }))
};

fs.writeFileSync(
  "./products-audit.json",
  JSON.stringify(report, null, 2),
  "utf8"
);

console.log(JSON.stringify(report, null, 2));
