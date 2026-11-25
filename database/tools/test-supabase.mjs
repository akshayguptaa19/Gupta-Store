
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const envText = readFileSync(".env.local", "utf8").replace(/^\uFEFF/, "");

function getEnv(name) {
  const line = envText.split(/\r?\n/).find(
    (line) => line.trim().startsWith(`${name}=`)
  );

  if (!line) return undefined;

  return line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

if (!url || !key) {
  console.error("Supabase URL or publishable key missing in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

const { count, error } = await supabase
  .from("products")
  .select("legacy_mongo_id", { count: "exact", head: true });

if (error) {
  console.error("Query failed:", error.message);
  process.exit(1);
}

console.log("Supabase connection successful.");
console.log("Products found:", count);
