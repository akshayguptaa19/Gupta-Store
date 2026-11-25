import { readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const source = join(
  homedir(),
  "Documents",
  "GuptaStore-Migration-Backup",
  "orders.json"
);

const lines = readFileSync(source, "utf8")
  .replace(/^\uFEFF/, "")
  .split(/\r?\n/)
  .filter(line => line.trim());

const orders = lines.map((line, index) => {
  try {
    return JSON.parse(line.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error(`Could not parse order record on line ${index + 1}`);
  }
});

function sqlString(value) {
  if (value === null || value === undefined || value === "") return "NULL";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function mongoValue(value) {
  if (value && typeof value === "object") {
    if (typeof value.$oid === "string") return value.$oid;
    if (value.$numberInt !== undefined) return Number(value.$numberInt);
    if (value.$numberLong !== undefined) return Number(value.$numberLong);
    if (value.$numberDouble !== undefined) return Number(value.$numberDouble);
    if (value.$date !== undefined) return value.$date;
    if (Array.isArray(value)) return value.map(mongoValue);
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, mongoValue(val)])
    );
  }
  if (Array.isArray(value)) return value.map(mongoValue);
  return value;
}

if (orders.length !== 6) {
  throw new Error(`Expected 6 orders; found ${orders.length}. No SQL file written.`);
}

const seenIds = new Set();
const seenOrderIds = new Set();

const statements = orders.map((order, index) => {
  const legacyId = order._id?.$oid;
  const orderId = order.orderId ?? order.id;

  if (!legacyId || !orderId) {
    throw new Error(`Missing original ID on order record ${index + 1}`);
  }
  if (seenIds.has(legacyId) || seenOrderIds.has(orderId)) {
    throw new Error(`Duplicate order identifier detected at record ${index + 1}`);
  }
  seenIds.add(legacyId);
  seenOrderIds.add(orderId);

  const data = mongoValue(order);
  const json = JSON.stringify(data).replace(/'/g, "''");
  const total = mongoValue(order.total);
  const validTotal = Number.isFinite(total) ? total : null;

  return `
INSERT INTO public.orders
  (legacy_mongo_id, order_id, status, payment, payment_status,
   total, order_data, created_at, updated_at)
SELECT
  ${sqlString(legacyId)},
  ${sqlString(orderId)},
  ${sqlString(order.status)},
  ${sqlString(order.payment)},
  ${sqlString(order.paymentStatus)},
  ${validTotal === null ? "NULL" : validTotal},
  '${json}'::jsonb,
  ${sqlString(order.createdAt)}::timestamptz,
  ${sqlString(order.updatedAt)}::timestamptz
WHERE NOT EXISTS (
  SELECT 1 FROM public.orders
  WHERE legacy_mongo_id = ${sqlString(legacyId)}
     OR order_id = ${sqlString(orderId)}
);`;
});

writeFileSync("./supabase-orders-import.sql", statements.join("\n"), "utf8");

console.log("Orders found:", orders.length);
console.log("Unique original MongoDB IDs:", seenIds.size);
console.log("Unique order IDs:", seenOrderIds.size);
console.log("SQL file created: supabase-orders-import.sql");
